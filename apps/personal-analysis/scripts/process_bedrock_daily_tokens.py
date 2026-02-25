#!/usr/bin/env python3
"""
Process Bedrock Daily Total Tokens by ModelId and fully integrate into the dashboard.

This script:
1. Parses the daily total tokens file (5 months of data)
2. Normalizes model names to match the report's conventions
3. Generates records.csv entries
4. Creates summary data for updating all dashboard sections
"""

import csv
import json
import re
from collections import defaultdict
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Tuple


def normalize_model_name(model_id: str) -> Tuple[str, str]:
    """
    Normalize Bedrock model IDs to display names.
    Returns (normalized_name, provider_category)
    """
    # Remove AWS region prefixes
    model_id = model_id.replace("us-east-1:", "").replace("us.", "").replace("global.", "")
    model_id = model_id.replace("anthropic.", "").replace("moonshotai.", "")
    
    # Map to display names
    mappings = {
        # Opus models
        "claude-opus-4-6-v1": ("Claude Opus 4.6", "bedrock"),
        "claude-opus-4-6": ("Claude Opus 4.6", "bedrock"),
        "claude-opus-4-5-20251101-v1:0": ("Claude Opus 4.5", "bedrock"),
        "claude-opus-4-5": ("Claude Opus 4.5", "bedrock"),
        "claude-opus-4-1-20250805-v1:0": ("Claude Opus 4.1", "bedrock"),
        "claude-opus-4-1": ("Claude Opus 4.1", "bedrock"),
        
        # Sonnet models
        "claude-sonnet-4-6": ("Claude Sonnet 4.6", "bedrock"),
        "claude-sonnet-4-5-20250929-v1:0": ("Claude Sonnet 4.5", "bedrock"),
        "claude-sonnet-4-5": ("Claude Sonnet 4.5", "bedrock"),
        "claude-3-5-sonnet-20241022-v2:0": ("Claude 3.5 Sonnet", "bedrock"),
        "claude-3-5-sonnet": ("Claude 3.5 Sonnet", "bedrock"),
        
        # Haiku models
        "claude-haiku-4-5-20251001-v1:0": ("Claude Haiku 4.5", "bedrock"),
        "claude-haiku-4-5": ("Claude Haiku 4.5", "bedrock"),
        "claude-3-5-haiku-20241022-v1:0": ("Claude 3.5 Haiku", "bedrock"),
        "claude-3-5-haiku": ("Claude 3.5 Haiku", "bedrock"),
        
        # Kimi
        "kimi-k2.5": ("Kimi K2.5", "bedrock"),
    }
    
    # Try exact match first
    if model_id in mappings:
        return mappings[model_id]
    
    # Try partial matching
    for pattern, (name, category) in mappings.items():
        if pattern in model_id or model_id in pattern:
            return (name, category)
    
    # Fallback: clean up the ID
    clean_name = model_id.replace("-", " ").title()
    return (clean_name, "bedrock")


def process_daily_tokens(input_path: Path) -> Dict:
    """Process the Daily_Total_Tokens_by_ModelId file."""
    
    with open(input_path, 'r', newline='', encoding='utf-8-sig') as f:
        reader = csv.reader(f)
        rows = list(reader)
    
    # Parse headers
    full_labels = rows[3]
    short_labels = rows[4]
    
    # Build column mapping
    model_columns = {}
    for i, short_label in enumerate(short_labels):
        if i == 0:
            continue
        display_name, _ = normalize_model_name(short_label)
        model_columns[i] = {
            'raw_id': short_label,
            'display_name': display_name,
        }
    
    # Parse data
    data_rows = rows[5:]
    
    # Aggregate by month and model
    by_month_model = defaultdict(lambda: defaultdict(int))
    by_model_total = defaultdict(int)
    
    for row in data_rows:
        if len(row) < 2:
            continue
        
        ts_str = row[0].strip()
        if not ts_str:
            continue
        
        try:
            ts = datetime.strptime(ts_str, '%Y/%m/%d %H:%M:%S')
            month = ts.strftime('%Y-%m')
            
            for col_idx, model_info in model_columns.items():
                if col_idx < len(row) and row[col_idx].strip():
                    try:
                        tokens = int(float(row[col_idx]))
                        if tokens > 0:
                            display_name = model_info['display_name']
                            by_month_model[month][display_name] += tokens
                            by_model_total[display_name] += tokens
                    except:
                        pass
        except:
            pass
    
    return {
        'by_month_model': dict(by_month_model),
        'by_model_total': dict(by_model_total),
        'grand_total': sum(by_model_total.values()),
    }


def generate_records(data: Dict) -> List[Dict]:
    """Generate records.csv entries."""
    records = []
    
    for month, models in sorted(data['by_month_model'].items()):
        year = month.split('-')[0]
        for model, tokens in sorted(models.items()):
            if tokens > 0:
                records.append({
                    'month': month,
                    'year': year,
                    'provider': 'aws-bedrock',
                    'source': 'aws-bedrock-daily-tokens',
                    'model': model,
                    'metric': 'total_tokens',
                    'value': tokens,
                    'unit': 'tokens',
                    'estimated': False,
                    'notes': 'From CloudWatch Daily Total Tokens by ModelId',
                })
    
    return records


def save_records(records: List[Dict], output_path: Path):
    """Save records to CSV."""
    output_path.parent.mkdir(parents=True, exist_ok=True)
    with open(output_path, 'w', newline='', encoding='utf-8') as f:
        writer = csv.DictWriter(f, fieldnames=[
            'month', 'year', 'provider', 'source', 'model', 'metric', 'value', 'unit', 'estimated', 'notes'
        ])
        writer.writeheader()
        writer.writerows(records)


def save_summary(data: Dict, output_path: Path):
    """Save summary JSON."""
    output_path.parent.mkdir(parents=True, exist_ok=True)
    
    summary = {
        'generated_at': datetime.now().isoformat(),
        'period': {
            'start': min(data['by_month_model'].keys()),
            'end': max(data['by_month_model'].keys()),
        },
        'by_month_model': data['by_month_model'],
        'by_model_total': data['by_model_total'],
        'grand_total': data['grand_total'],
    }
    
    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(summary, f, indent=2)


def main():
    input_path = Path('/Users/jholt/Downloads/Daily_Total_Tokens_by_ModelId-2025_10_29_08_00_00-2026_02_24_08_00_00-UTC.csv')
    output_dir = Path('data/private/bedrock-usage/processed')
    
    print("=" * 60)
    print("BEDROCK DAILY TOKENS PROCESSOR")
    print("=" * 60)
    
    print(f"\n📂 Processing: {input_path.name}")
    data = process_daily_tokens(input_path)
    
    print(f"\n📊 Summary:")
    print(f"   Period: {min(data['by_month_model'].keys())} to {max(data['by_month_model'].keys())}")
    print(f"   Grand Total: {data['grand_total']:,} tokens")
    print(f"   Models: {len(data['by_model_total'])}")
    
    print(f"\n📅 Monthly breakdown:")
    for month in sorted(data['by_month_model'].keys()):
        models = data['by_month_model'][month]
        month_total = sum(models.values())
        print(f"   {month}: {month_total:,} tokens ({len(models)} models)")
    
    print(f"\n🔝 Top models by total tokens:")
    sorted_models = sorted(data['by_model_total'].items(), key=lambda x: -x[1])
    for model, tokens in sorted_models:
        pct = (tokens / data['grand_total']) * 100
        print(f"   - {model}: {tokens:,} ({pct:.1f}%)")
    
    # Generate and save records
    records = generate_records(data)
    records_path = output_dir / 'bedrock_daily_tokens_records.csv'
    save_records(records, records_path)
    print(f"\n💾 Generated {len(records)} records: {records_path}")
    
    # Save summary
    summary_path = output_dir / 'bedrock_daily_tokens_summary.json'
    save_summary(data, summary_path)
    print(f"💾 Summary saved: {summary_path}")
    
    print("\n" + "=" * 60)
    print("Processing complete!")
    print("=" * 60)


if __name__ == "__main__":
    main()
