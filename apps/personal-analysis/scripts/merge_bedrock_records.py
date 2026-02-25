#!/usr/bin/env python3
"""
Merge Bedrock CloudWatch records into the main records.csv.
"""

import csv
import argparse
from pathlib import Path


def load_records(path: Path) -> list:
    """Load records from CSV."""
    with open(path, 'r', newline='', encoding='utf-8-sig') as f:
        reader = csv.DictReader(f)
        return list(reader)


def save_records(records: list, path: Path):
    """Save records to CSV."""
    path.parent.mkdir(parents=True, exist_ok=True)
    if not records:
        return
    
    fieldnames = list(records[0].keys())
    with open(path, 'w', newline='', encoding='utf-8') as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(records)


def merge_bedrock_records(main_records: list, bedrock_records: list) -> list:
    """
    Merge Bedrock records into main records.
    
    Strategy:
    - Remove existing aws-bedrock-cloudwatch entries (to avoid duplicates)
    - Add new bedrock records
    - Sort by month, provider, source, model, metric
    """
    # Filter out old Bedrock CloudWatch records
    filtered = [
        r for r in main_records 
        if not (r.get('provider') == 'aws-bedrock' and r.get('source') == 'aws-bedrock-cloudwatch')
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


def main():
    parser = argparse.ArgumentParser(description="Merge Bedrock CloudWatch records into main records.csv")
    parser.add_argument("--bedrock-records", default="data/private/bedrock-usage/processed/bedrock_cloudwatch_records.csv")
    parser.add_argument("--main-records", default="data/private/derived/personal-analysis/records.csv")
    parser.add_argument("--output", default="data/private/derived/personal-analysis/records.csv")
    args = parser.parse_args()
    
    bedrock_path = Path(args.bedrock_records)
    main_path = Path(args.main_records)
    output_path = Path(args.output)
    
    print("=" * 60)
    print("MERGE BEDROCK RECORDS")
    print("=" * 60)
    
    # Load records
    print(f"\n📂 Loading main records: {main_path}")
    main_records = load_records(main_path)
    print(f"   ✓ Loaded {len(main_records):,} records")
    
    # Count existing Bedrock records
    existing_bedrock = [
        r for r in main_records 
        if r.get('provider') == 'aws-bedrock' and r.get('source') == 'aws-bedrock-cloudwatch'
    ]
    print(f"   (Found {len(existing_bedrock):,} existing Bedrock CloudWatch records to replace)")
    
    print(f"\n📂 Loading Bedrock records: {bedrock_path}")
    bedrock_records = load_records(bedrock_path)
    print(f"   ✓ Loaded {len(bedrock_records):,} records")
    
    # Merge
    print(f"\n🔀 Merging records...")
    merged = merge_bedrock_records(main_records, bedrock_records)
    print(f"   ✓ Merged: {len(main_records):,} - {len(existing_bedrock):,} + {len(bedrock_records):,} = {len(merged):,}")
    
    # Save
    save_records(merged, output_path)
    print(f"\n💾 Saved to: {output_path}")
    
    print("\n" + "=" * 60)
    print("Merge complete!")
    print("=" * 60)


if __name__ == "__main__":
    main()
