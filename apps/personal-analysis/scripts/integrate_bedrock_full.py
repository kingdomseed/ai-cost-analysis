#!/usr/bin/env python3
"""
Fully integrate Bedrock daily tokens into the main records and spending report.

This script:
1. Merges Bedrock records into main records.csv
2. Removes old/duplicate Bedrock records
3. Updates all dashboard sections with proper totals
"""

import csv
import json
from collections import defaultdict
from pathlib import Path
from typing import Dict, List


def load_records(path: Path) -> List[Dict]:
    """Load records from CSV."""
    with open(path, 'r', newline='', encoding='utf-8-sig') as f:
        reader = csv.DictReader(f)
        return list(reader)


def save_records(records: List[Dict], path: Path):
    """Save records to CSV."""
    path.parent.mkdir(parents=True, exist_ok=True)
    if not records:
        return
    
    fieldnames = list(records[0].keys())
    with open(path, 'w', newline='', encoding='utf-8') as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(records)


def merge_bedrock_records(main_records: List[Dict], bedrock_records: List[Dict]) -> List[Dict]:
    """
    Merge Bedrock records into main records.
    
    Strategy:
    - Remove ALL existing aws-bedrock-cloudwatch and aws-bedrock-daily-tokens entries
    - Add new consolidated bedrock records
    - Sort by month, provider, source, model, metric
    """
    # Filter out ALL old Bedrock records from cloudwatch/daily-tokens sources
    filtered = [
        r for r in main_records 
        if not (
            r.get('provider') == 'aws-bedrock' 
            and r.get('source') in ['aws-bedrock-cloudwatch', 'aws-bedrock-daily-tokens']
        )
    ]
    
    # Add new records
    merged = filtered + bedrock_records
    
    # Sort
    merged.sort(key=lambda r: (
        r.get('month', ''),
        r.get('provider', ''),
        r.get('source', ''),
        r.get('model', ''),
        r.get('metric', ''),
    ))
    
    return merged


def aggregate_for_dashboard(records: List[Dict]) -> Dict:
    """
    Aggregate data for dashboard updates.
    
    Returns structure with:
    - provider_totals
    - model_rankings
    - monthly_totals
    """
    # Provider totals
    provider_tokens = defaultdict(lambda: defaultdict(float))
    
    # Model rankings (across all providers)
    model_tokens = defaultdict(lambda: defaultdict(float))
    
    # Monthly totals
    monthly_totals = defaultdict(lambda: defaultdict(float))
    
    for r in records:
        if r.get('metric') != 'total_tokens':
            continue
        
        month = r.get('month', 'unknown')
        provider = r.get('provider', 'unknown')
        source = r.get('source', 'unknown')
        model = r.get('model', 'unknown')
        
        try:
            val = float(r.get('value', 0))
        except:
            continue
        
        # Provider totals
        provider_tokens[provider][month] += val
        
        # Model tokens - include provider source in key for deduplication
        model_key = model
        model_tokens[model_key]['total'] += val
        model_tokens[model_key]['provider'] = provider
        model_tokens[model_key]['source'] = source
        
        # Monthly totals
        monthly_totals[month]['total'] += val
    
    return {
        'provider_tokens': dict(provider_tokens),
        'model_tokens': dict(model_tokens),
        'monthly_totals': dict(monthly_totals),
    }


def print_dashboard_summary(aggregates: Dict):
    """Print summary for verification."""
    print("\n📊 DASHBOARD SUMMARY")
    print("=" * 60)
    
    # Provider totals
    print("\nProvider Token Totals:")
    for provider, months in sorted(aggregates['provider_tokens'].items()):
        total = sum(months.values())
        print(f"  {provider}: {total:,.0f} tokens")
        for month, val in sorted(months.items()):
            print(f"    {month}: {val:,.0f}")
    
    # Top models
    print("\nTop 15 Models by Total Tokens:")
    sorted_models = sorted(
        aggregates['model_tokens'].items(),
        key=lambda x: -x[1]['total']
    )[:15]
    for i, (model, data) in enumerate(sorted_models, 1):
        print(f"  {i}. {model}: {data['total']:,.0f} ({data['provider']})")


def main():
    main_records_path = Path("data/private/derived/personal-analysis/records.csv")
    bedrock_records_path = Path("data/private/bedrock-usage/processed/bedrock_daily_tokens_records.csv")
    output_path = Path("data/private/derived/personal-analysis/records.csv")
    
    print("=" * 60)
    print("FULL BEDROCK INTEGRATION")
    print("=" * 60)
    
    # Load records
    print(f"\n📂 Loading main records: {main_records_path}")
    main_records = load_records(main_records_path)
    print(f"   ✓ {len(main_records):,} records")
    
    # Count existing Bedrock records to be replaced
    existing_bedrock = [
        r for r in main_records 
        if r.get('provider') == 'aws-bedrock' 
        and r.get('source') in ['aws-bedrock-cloudwatch', 'aws-bedrock-daily-tokens']
    ]
    print(f"   (Replacing {len(existing_bedrock):,} existing Bedrock records)")
    
    print(f"\n📂 Loading new Bedrock records: {bedrock_records_path}")
    bedrock_records = load_records(bedrock_records_path)
    print(f"   ✓ {len(bedrock_records):,} records")
    
    # Show Bedrock summary
    bedrock_total = sum(float(r['value']) for r in bedrock_records if r['metric'] == 'total_tokens')
    print(f"   ✓ Bedrock total: {bedrock_total:,.0f} tokens")
    
    # Merge
    print(f"\n🔀 Merging records...")
    merged = merge_bedrock_records(main_records, bedrock_records)
    print(f"   ✓ {len(main_records):,} - {len(existing_bedrock):,} + {len(bedrock_records):,} = {len(merged):,}")
    
    # Aggregate for dashboard
    print(f"\n📊 Calculating dashboard aggregates...")
    aggregates = aggregate_for_dashboard(merged)
    print_dashboard_summary(aggregates)
    
    # Save merged records
    save_records(merged, output_path)
    print(f"\n💾 Saved to: {output_path}")
    
    # Save aggregates for report generation
    aggregates_path = Path("data/private/bedrock-usage/processed/dashboard_aggregates.json")
    with open(aggregates_path, 'w') as f:
        json.dump(aggregates, f, indent=2)
    print(f"💾 Dashboard aggregates: {aggregates_path}")
    
    print("\n" + "=" * 60)
    print("Integration complete!")
    print("=" * 60)
    
    print("\n⚠️  NEXT STEPS:")
    print("   Run update_spending_report.py to regenerate the HTML with new totals")


if __name__ == "__main__":
    main()
