#!/usr/bin/env python3
"""
Process Bedrock CloudWatch metric exports and generate aggregated token data.

This script:
1. Cleans CloudWatch CSV exports (removes blank rows)
2. Parses per-model token counts from metric labels
3. Aggregates by month, model, and token type
4. Outputs cleaned CSVs and a summary JSON for integration into records.csv
"""

import argparse
import csv
import json
import re
from collections import defaultdict
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Optional, Tuple


def parse_model_from_metric_label(label: str) -> Tuple[str, str]:
    """
    Extract model name and metric type from CloudWatch metric label.
    
    Example input: "us-east-1:AWS/Bedrock ModelId:us.anthropic.claude-opus-4-6-v1 InputTokenCount Sum 60"
    Returns: ("claude-opus-4.6", "input")
    """
    # Remove AWS region prefix and provider namespaces
    label = label.replace("us-east-1:AWS/Bedrock ModelId:", "")
    label = label.replace("global.anthropic.", "")
    label = label.replace("us.anthropic.", "")
    label = label.replace("moonshotai.", "")
    
    # Determine metric type
    metric_type = None
    if "InputTokenCount" in label:
        metric_type = "input"
    elif "OutputTokenCount" in label:
        metric_type = "output"
    elif "Invocations" in label:
        metric_type = "invocations"
    
    # Extract model name - handle various version formats
    model = "unknown"
    
    # Pattern: claude-opus-4-6-v1, claude-opus-4-6, claude-sonnet-4-5-20250929-v1:0, etc.
    patterns = [
        (r'(claude-opus-4[.-]6(?:-v\d+)?(?::\d+)?)', 'claude-opus-4.6'),
        (r'(claude-opus-4[.-]5(?:-v\d+)?(?::\d+)?)', 'claude-opus-4.5'),
        (r'(claude-opus-4[.-]1(?:-v\d+)?(?::\d+)?)', 'claude-opus-4.1'),
        (r'(claude-sonnet-4[.-]6(?:-v\d+)?(?::\d+)?)', 'claude-sonnet-4.6'),
        (r'(claude-sonnet-4[.-]5(?:-v\d+)?(?::\d+)?)', 'claude-sonnet-4.5'),
        (r'(claude-haiku-4[.-]5(?:-v\d+)?(?::\d+)?)', 'claude-haiku-4.5'),
        (r'(claude-3-5-haiku-\d+)', 'claude-3-5-haiku'),
        (r'(claude-3-5-sonnet-\d+)', 'claude-3-5-sonnet'),
        (r'(kimi-k[\d.]+)', 'kimi-k2.5'),
    ]
    
    for pattern, normalized in patterns:
        match = re.search(pattern, label, re.IGNORECASE)
        if match:
            model = normalized
            break
    
    return model, metric_type


def clean_cloudwatch_csv(input_path: Path, output_path: Path) -> Dict:
    """
    Clean CloudWatch CSV by removing blank rows and parsing headers.
    
    CloudWatch exports have:
    - Row 1: Generic IDs
    - Row 2: Status codes
    - Row 3: Messages (usually empty)
    - Row 4: Full metric labels with model info
    - Row 5: Short labels
    - Row 6+: Data rows (many blank)
    
    Returns metadata about the columns.
    """
    with open(input_path, 'r', newline='', encoding='utf-8-sig') as f:
        reader = csv.reader(f)
        all_rows = list(reader)
    
    if len(all_rows) < 5:
        raise ValueError(f"Expected at least 5 header rows in {input_path}")
    
    # Extract headers
    id_row = all_rows[0]
    status_row = all_rows[1]
    messages_row = all_rows[2]
    full_labels_row = all_rows[3]
    short_labels_row = all_rows[4]
    data_rows = all_rows[5:]
    
    # Build column metadata
    columns = []
    timestamp_col = None
    for i, full_label in enumerate(full_labels_row):
        if i == 0:
            timestamp_col = i
            columns.append({
                'index': i,
                'type': 'timestamp',
                'full_label': full_label,
                'short_label': short_labels_row[i] if i < len(short_labels_row) else '',
            })
        else:
            model, metric_type = parse_model_from_metric_label(full_label)
            columns.append({
                'index': i,
                'type': 'metric',
                'full_label': full_label,
                'short_label': short_labels_row[i] if i < len(short_labels_row) else '',
                'model': model,
                'metric_type': metric_type,
            })
    
    # Filter out blank rows (rows where all data values are empty)
    cleaned_data = []
    for row in data_rows:
        if len(row) <= 1:
            continue
        # Check if any metric column has a value
        has_data = False
        for col in columns[1:]:  # Skip timestamp column
            if col['index'] < len(row) and row[col['index']].strip():
                has_data = True
                break
        if has_data:
            cleaned_data.append(row)
    
    # Write cleaned CSV
    output_path.parent.mkdir(parents=True, exist_ok=True)
    with open(output_path, 'w', newline='', encoding='utf-8') as f:
        writer = csv.writer(f)
        # Write header rows
        writer.writerow(id_row)
        writer.writerow(status_row)
        writer.writerow(messages_row)
        writer.writerow(full_labels_row)
        writer.writerow(short_labels_row)
        # Write cleaned data
        writer.writerows(cleaned_data)
    
    return {
        'total_rows': len(data_rows),
        'cleaned_rows': len(cleaned_data),
        'columns': columns,
        'models': list(set(col['model'] for col in columns if col.get('model') and col['model'] != 'unknown')),
    }


def parse_timestamp(ts_str: str) -> Optional[datetime]:
    """Parse CloudWatch timestamp format."""
    try:
        # Format: 2026/02/10 11:30:00
        return datetime.strptime(ts_str.strip(), "%Y/%m/%d %H:%M:%S")
    except ValueError:
        try:
            # Try alternative format
            return datetime.strptime(ts_str.strip(), "%Y-%m-%d %H:%M:%S")
        except ValueError:
            return None


def get_month_key(dt: datetime) -> str:
    """Get YYYY-MM format from datetime."""
    return dt.strftime("%Y-%m")


def aggregate_metrics(cleaned_path: Path, metadata: Dict) -> Dict:
    """
    Aggregate metrics by month and model.
    
    Returns structure:
    {
        "2026-02": {
            "claude-opus-4.6": {
                "input_tokens": 12345,
                "output_tokens": 6789,
                "total_tokens": 19134,
                "invocations": 42
            }
        }
    }
    """
    aggregates: Dict[str, Dict[str, Dict[str, int]]] = defaultdict(lambda: defaultdict(lambda: {
        'input_tokens': 0,
        'output_tokens': 0,
        'total_tokens': 0,
        'invocations': 0,
    }))
    
    columns = metadata['columns']
    metric_columns = [c for c in columns if c['type'] == 'metric']
    
    with open(cleaned_path, 'r', newline='', encoding='utf-8') as f:
        reader = csv.reader(f)
        # Skip header rows
        for _ in range(5):
            next(reader, None)
        
        for row in reader:
            if len(row) < 2:
                continue
            
            # Parse timestamp
            ts = parse_timestamp(row[0])
            if not ts:
                continue
            
            month = get_month_key(ts)
            
            # Process each metric column
            for col in metric_columns:
                if col['index'] >= len(row):
                    continue
                
                val_str = row[col['index']].strip()
                if not val_str:
                    continue
                
                try:
                    val = int(float(val_str))
                except ValueError:
                    continue
                
                model = col.get('model', 'unknown')
                metric_type = col.get('metric_type')
                
                if model == 'unknown' or not metric_type:
                    continue
                
                if metric_type == 'input':
                    aggregates[month][model]['input_tokens'] += val
                    aggregates[month][model]['total_tokens'] += val
                elif metric_type == 'output':
                    aggregates[month][model]['output_tokens'] += val
                    aggregates[month][model]['total_tokens'] += val
                elif metric_type == 'invocations':
                    aggregates[month][model]['invocations'] += val
    
    return dict(aggregates)


def merge_aggregates(base: Dict, additional: Dict) -> Dict:
    """Merge two aggregate dictionaries."""
    result = defaultdict(lambda: defaultdict(lambda: {
        'input_tokens': 0,
        'output_tokens': 0,
        'total_tokens': 0,
        'invocations': 0,
    }))
    
    for source in [base, additional]:
        for month, models in source.items():
            for model, data in models.items():
                for key in ['input_tokens', 'output_tokens', 'total_tokens', 'invocations']:
                    result[month][model][key] += data[key]
    
    return dict(result)


def generate_records_csv(aggregates: Dict, output_path: Path):
    """Generate records.csv entries for Bedrock token usage."""
    records = []
    
    for month, models in sorted(aggregates.items()):
        year = month.split('-')[0]
        for model, data in sorted(models.items()):
            if data['input_tokens'] > 0:
                records.append({
                    'month': month,
                    'year': year,
                    'provider': 'aws-bedrock',
                    'source': 'aws-bedrock-cloudwatch',
                    'model': model,
                    'metric': 'input_tokens',
                    'value': data['input_tokens'],
                    'unit': 'tokens',
                    'estimated': False,
                    'notes': 'From CloudWatch Bedrock metrics',
                })
            if data['output_tokens'] > 0:
                records.append({
                    'month': month,
                    'year': year,
                    'provider': 'aws-bedrock',
                    'source': 'aws-bedrock-cloudwatch',
                    'model': model,
                    'metric': 'output_tokens',
                    'value': data['output_tokens'],
                    'unit': 'tokens',
                    'estimated': False,
                    'notes': 'From CloudWatch Bedrock metrics',
                })
            if data['total_tokens'] > 0:
                records.append({
                    'month': month,
                    'year': year,
                    'provider': 'aws-bedrock',
                    'source': 'aws-bedrock-cloudwatch',
                    'model': model,
                    'metric': 'total_tokens',
                    'value': data['total_tokens'],
                    'unit': 'tokens',
                    'estimated': False,
                    'notes': 'From CloudWatch Bedrock metrics',
                })
            if data['invocations'] > 0:
                records.append({
                    'month': month,
                    'year': year,
                    'provider': 'aws-bedrock',
                    'source': 'aws-bedrock-cloudwatch',
                    'model': model,
                    'metric': 'invocations',
                    'value': data['invocations'],
                    'unit': 'requests',
                    'estimated': False,
                    'notes': 'From CloudWatch Bedrock metrics',
                })
    
    output_path.parent.mkdir(parents=True, exist_ok=True)
    with open(output_path, 'w', newline='', encoding='utf-8') as f:
        writer = csv.DictWriter(f, fieldnames=[
            'month', 'year', 'provider', 'source', 'model', 'metric', 'value', 'unit', 'estimated', 'notes'
        ])
        writer.writeheader()
        writer.writerows(records)
    
    return records


def generate_summary_json(aggregates: Dict, output_path: Path):
    """Generate a summary JSON for easy inspection."""
    # Calculate grand totals
    grand_totals = {
        'input_tokens': 0,
        'output_tokens': 0,
        'total_tokens': 0,
        'invocations': 0,
    }
    
    for month, models in aggregates.items():
        for model, data in models.items():
            for key in grand_totals:
                grand_totals[key] += data[key]
    
    summary = {
        'generated_at': datetime.now().isoformat(),
        'period': {
            'start': min(aggregates.keys()) if aggregates else None,
            'end': max(aggregates.keys()) if aggregates else None,
        },
        'by_month_model': aggregates,
        'grand_totals': grand_totals,
    }
    
    output_path.parent.mkdir(parents=True, exist_ok=True)
    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(summary, f, indent=2)
    
    return summary


def main():
    parser = argparse.ArgumentParser(description="Process Bedrock CloudWatch exports")
    parser.add_argument("--input-dir", default="data/private/bedrock-usage/new", help="Input directory with CloudWatch exports")
    parser.add_argument("--output-dir", default="data/private/bedrock-usage/processed", help="Output directory")
    args = parser.parse_args()
    
    input_dir = Path(args.input_dir)
    output_dir = Path(args.output_dir)
    
    print("=" * 60)
    print("BEDROCK CLOUDWATCH DATA PROCESSOR")
    print("=" * 60)
    
    all_aggregates = {}
    
    # Process Token_Counts_by_Model
    token_counts_file = input_dir / "Token_Counts_by_Model-2026_02_10_11_30_00-2026_02_24_22_11_00-UTC.csv"
    if token_counts_file.exists():
        print(f"\n📊 Processing: {token_counts_file.name}")
        cleaned_path = output_dir / "token_counts_by_model_cleaned.csv"
        metadata = clean_cloudwatch_csv(token_counts_file, cleaned_path)
        print(f"   ✓ Cleaned: {metadata['total_rows']:,} rows → {metadata['cleaned_rows']:,} rows")
        print(f"   ✓ Models found: {', '.join(metadata['models'])}")
        
        aggregates = aggregate_metrics(cleaned_path, metadata)
        all_aggregates = merge_aggregates(all_aggregates, aggregates)
    
    # Process Invocation_Count
    invocation_file = input_dir / "Invocation_Count-2026_02_10_11_30_00-2026_02_24_22_11_00-UTC.csv"
    if invocation_file.exists():
        print(f"\n📊 Processing: {invocation_file.name}")
        cleaned_path = output_dir / "invocation_counts_cleaned.csv"
        metadata = clean_cloudwatch_csv(invocation_file, cleaned_path)
        print(f"   ✓ Cleaned: {metadata['total_rows']:,} rows → {metadata['cleaned_rows']:,} rows")
        print(f"   ✓ Models found: {', '.join(metadata['models'])}")
        
        aggregates = aggregate_metrics(cleaned_path, metadata)
        all_aggregates = merge_aggregates(all_aggregates, aggregates)
    
    # Generate outputs
    if all_aggregates:
        # Generate summary
        summary_path = output_dir / "bedrock_token_summary.json"
        summary = generate_summary_json(all_aggregates, summary_path)
        print(f"\n📈 Summary:")
        print(f"   Period: {summary['period']['start']} to {summary['period']['end']}")
        print(f"   Total Input Tokens:  {summary['grand_totals']['input_tokens']:,}")
        print(f"   Total Output Tokens: {summary['grand_totals']['output_tokens']:,}")
        print(f"   Total Tokens:        {summary['grand_totals']['total_tokens']:,}")
        print(f"   Total Invocations:   {summary['grand_totals']['invocations']:,}")
        
        # Generate records
        records_path = output_dir / "bedrock_cloudwatch_records.csv"
        records = generate_records_csv(all_aggregates, records_path)
        print(f"\n💾 Generated {len(records)} records: {records_path}")
        
        # Print breakdown by month
        print(f"\n📅 Monthly Breakdown:")
        for month, models in sorted(all_aggregates.items()):
            month_total = sum(m['total_tokens'] for m in models.values())
            month_invocations = sum(m['invocations'] for m in models.values())
            print(f"   {month}: {month_total:,} tokens, {month_invocations:,} invocations across {len(models)} models")
            for model, data in sorted(models.items(), key=lambda x: -x[1]['total_tokens']):
                if data['total_tokens'] > 0 or data['invocations'] > 0:
                    print(f"      - {model}: {data['input_tokens']:,} in / {data['output_tokens']:,} out ({data['invocations']:,} inv)")
    else:
        print("\n❌ No data processed")
    
    print("\n" + "=" * 60)
    print("Processing complete!")
    print("=" * 60)


if __name__ == "__main__":
    main()
