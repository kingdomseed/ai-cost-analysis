#!/usr/bin/env python3
"""
Clean Bedrock usage CSVs by removing empty rows and compressing to relevant data range.
"""
import csv
import sys
from pathlib import Path
from datetime import datetime

def clean_csv(input_path: Path, output_path: Path):
    """Remove empty rows from CSV, keeping only rows with actual data."""
    with open(input_path, 'r', newline='') as f:
        reader = csv.reader(f)
        rows = list(reader)
    
    # First 5 rows are metadata headers
    header_rows = rows[:5]
    data_rows = rows[5:]
    
    # Filter to only rows with at least one non-empty data value
    cleaned_data = []
    for row in data_rows:
        if len(row) < 2:
            continue
        timestamp = row[0]
        data_values = row[1:]
        # Check if any data value is non-empty
        has_data = any(v.strip() not in ('', ' ') for v in data_values)
        if has_data:
            cleaned_data.append(row)
    
    if not cleaned_data:
        print(f"  No data rows found in {input_path.name}")
        return
    
    # Write cleaned file
    with open(output_path, 'w', newline='') as f:
        writer = csv.writer(f)
        writer.writerows(header_rows)
        writer.writerows(cleaned_data)
    
    # Print stats
    first_ts = cleaned_data[0][0]
    last_ts = cleaned_data[-1][0]
    print(f"  {input_path.name}:")
    print(f"    Original rows: {len(data_rows)}")
    print(f"    Kept rows: {len(cleaned_data)}")
    print(f"    Date range: {first_ts} to {last_ts}")
    print(f"    Compression: {len(cleaned_data)/len(data_rows)*100:.1f}%")

def main():
    input_dir = Path("data/private/bedrock-usage")
    output_dir = Path("data/private/bedrock-usage/cleaned")
    output_dir.mkdir(exist_ok=True)
    
    csv_files = list(input_dir.glob("*.csv"))
    print(f"Found {len(csv_files)} CSV files to clean\n")
    
    for csv_file in sorted(csv_files):
        output_file = output_dir / csv_file.name
        clean_csv(csv_file, output_file)
    
    print(f"\nCleaned files written to: {output_dir}")

if __name__ == "__main__":
    main()
