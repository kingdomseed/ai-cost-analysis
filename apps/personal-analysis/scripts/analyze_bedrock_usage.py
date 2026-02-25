#!/usr/bin/env python3
"""
Analyze Bedrock usage data and generate summary insights.
"""
import csv
import json
from pathlib import Path
from datetime import datetime
from collections import defaultdict

# Bedrock pricing (per 1M tokens) - from AWS pricing
BEDROCK_RATES = {
    "claude-sonnet-4.5": {"input": 3.00, "output": 15.00},
    "claude-sonnet-4.6": {"input": 3.50, "output": 17.50},
    "claude-opus-4.1": {"input": 15.00, "output": 75.00},
    "claude-opus-4.5": {"input": 15.00, "output": 75.00},
    "claude-opus-4.6": {"input": 18.00, "output": 90.00},
    "claude-haiku-4.5": {"input": 1.00, "output": 5.00},
    "claude-3-5-haiku": {"input": 0.80, "output": 4.00},
    "claude-3-5-sonnet": {"input": 3.00, "output": 15.00},
    "kimi-k2.5": {"input": 0.60, "output": 3.00},
}

def parse_model_from_label(label: str) -> str:
    """Extract model name from CloudWatch metric label."""
    # Example: "us-east-1:AWS/Bedrock ModelId:us.anthropic.claude-sonnet-4-5-20250929-v1:0 InputTokenCount"
    if "claude-sonnet-4-5" in label or "claude-sonnet-4.5" in label:
        return "claude-sonnet-4.5"
    elif "claude-sonnet-4-6" in label or "claude-sonnet-4.6" in label:
        return "claude-sonnet-4.6"
    elif "claude-opus-4-1" in label or "claude-opus-4.1" in label:
        return "claude-opus-4.1"
    elif "claude-opus-4-5" in label or "claude-opus-4.5" in label:
        return "claude-opus-4.5"
    elif "claude-opus-4-6" in label or "claude-opus-4.6" in label:
        return "claude-opus-4.6"
    elif "claude-haiku-4-5" in label or "claude-haiku-4.5" in label:
        return "claude-haiku-4.5"
    elif "claude-3-5-haiku" in label:
        return "claude-3-5-haiku"
    elif "claude-3-5-sonnet" in label:
        return "claude-3-5-sonnet"
    elif "kimi-k2.5" in label or "kimi-k2-5" in label:
        return "kimi-k2.5"
    return "unknown"

def analyze_token_counts_by_model(input_file: Path):
    """Analyze the detailed token counts by model."""
    with open(input_file, 'r', newline='') as f:
        reader = csv.reader(f)
        rows = list(reader)
    
    # Parse headers (row 4 has labels, row 3 has full descriptions)
    labels = rows[4]
    full_labels = rows[3]
    
    # Build column mapping
    models = {}
    for i, label in enumerate(labels):
        if i == 0:  # Timestamp column
            continue
        model = parse_model_from_label(full_labels[i])
        metric_type = "input" if "InputTokenCount" in label else "output" if "OutputTokenCount" in label else None
        if model and metric_type:
            if model not in models:
                models[model] = {}
            models[model][metric_type] = i
    
    # Aggregate data
    totals = defaultdict(lambda: {"input": 0, "output": 0, "invocations": 0})
    
    for row in rows[5:]:  # Skip header rows
        for model, columns in models.items():
            if "input" in columns:
                val = row[columns["input"]].strip()
                if val:
                    totals[model]["input"] += int(float(val))
            if "output" in columns:
                val = row[columns["output"]].strip()
                if val:
                    totals[model]["output"] += int(float(val))
    
    return dict(totals), models

def analyze_invocations(input_file: Path, model_columns: dict):
    """Add invocation counts to the totals."""
    with open(input_file, 'r', newline='') as f:
        reader = csv.reader(f)
        rows = list(reader)
    
    labels = rows[4]
    full_labels = rows[3]
    
    # Map columns to models
    col_to_model = {}
    for i, label in enumerate(labels):
        if i == 0:
            continue
        model = parse_model_from_label(full_labels[i])
        if model:
            col_to_model[i] = model
    
    # Aggregate invocations
    invocations = defaultdict(int)
    for row in rows[5:]:
        for col, model in col_to_model.items():
            val = row[col].strip()
            if val:
                invocations[model] += int(float(val))
    
    return dict(invocations)

def calculate_costs(totals: dict) -> dict:
    """Calculate estimated costs for each model."""
    costs = {}
    for model, data in totals.items():
        rate = BEDROCK_RATES.get(model, {"input": 0, "output": 0})
        input_cost = (data["input"] / 1_000_000) * rate["input"]
        output_cost = (data["output"] / 1_000_000) * rate["output"]
        costs[model] = {
            "input_cost": round(input_cost, 2),
            "output_cost": round(output_cost, 2),
            "total_cost": round(input_cost + output_cost, 2),
        }
    return costs

def main():
    data_dir = Path("data/private/bedrock-usage/cleaned")
    
    print("=" * 60)
    print("BEDROCK USAGE ANALYSIS")
    print("=" * 60)
    
    # Analyze token counts by model
    token_file = data_dir / "Token_Counts_by_Model-2026_02_10_11_30_00-2026_02_24_22_11_00-UTC.csv"
    if token_file.exists():
        print("\n📊 Token Counts by Model")
        print("-" * 40)
        totals, model_columns = analyze_token_counts_by_model(token_file)
        
        # Add invocation counts
        inv_file = data_dir / "Invocation_Count-2026_02_10_11_30_00-2026_02_24_22_11_00-UTC.csv"
        if inv_file.exists():
            invocations = analyze_invocations(inv_file, model_columns)
            for model, count in invocations.items():
                if model in totals:
                    totals[model]["invocations"] = count
        
        # Calculate costs
        costs = calculate_costs(totals)
        
        # Print summary
        grand_total_input = 0
        grand_total_output = 0
        grand_total_cost = 0
        
        for model in sorted(totals.keys()):
            data = totals[model]
            cost = costs.get(model, {})
            total_tokens = data["input"] + data["output"]
            
            print(f"\n  {model}:")
            print(f"    Input tokens:  {data['input']:,}")
            print(f"    Output tokens: {data['output']:,}")
            print(f"    Total tokens:  {total_tokens:,}")
            print(f"    Invocations:   {data.get('invocations', 0):,}")
            if cost:
                print(f"    Est. cost:     ${cost['total_cost']:.2f}")
            
            grand_total_input += data["input"]
            grand_total_output += data["output"]
            grand_total_cost += cost.get("total_cost", 0)
        
        print("\n" + "=" * 40)
        print("GRAND TOTALS")
        print("=" * 40)
        print(f"  Total input tokens:  {grand_total_input:,}")
        print(f"  Total output tokens: {grand_total_output:,}")
        print(f"  Total tokens:        {grand_total_input + grand_total_output:,}")
        print(f"  Estimated cost:      ${grand_total_cost:.2f}")
        
        # Save JSON report
        report = {
            "generated_at": datetime.now().isoformat(),
            "period": "2026-02-10 to 2026-02-24",
            "by_model": {
                model: {
                    "input_tokens": totals[model]["input"],
                    "output_tokens": totals[model]["output"],
                    "total_tokens": totals[model]["input"] + totals[model]["output"],
                    "invocations": totals[model].get("invocations", 0),
                    "estimated_cost": costs.get(model, {}),
                }
                for model in totals
            },
            "totals": {
                "input_tokens": grand_total_input,
                "output_tokens": grand_total_output,
                "total_tokens": grand_total_input + grand_total_output,
                "estimated_cost": round(grand_total_cost, 2),
            }
        }
        
        output_file = Path("data/private/bedrock-usage/bedrock-usage-summary.json")
        with open(output_file, 'w') as f:
            json.dump(report, f, indent=2)
        print(f"\n💾 Report saved to: {output_file}")

if __name__ == "__main__":
    main()
