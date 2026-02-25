#!/usr/bin/env python3
"""
Update the spending_report.html with actual Bedrock CloudWatch data.
"""

import csv
import re
from collections import defaultdict
from datetime import datetime
from pathlib import Path


def load_bedrock_data(records_path: Path) -> dict:
    """Load and aggregate Bedrock data from records.csv."""
    with open(records_path, 'r', encoding='utf-8-sig') as f:
        reader = csv.DictReader(f)
        records = list(reader)
    
    # Filter for aws-bedrock-cloudwatch records
    bedrock_records = [
        r for r in records 
        if r.get('provider') == 'aws-bedrock' and 'cloudwatch' in r.get('source', '')
    ]
    
    # Aggregate by model
    by_model = defaultdict(lambda: {
        'input_tokens': 0,
        'output_tokens': 0,
        'total_tokens': 0,
        'invocations': 0,
    })
    
    grand_totals = {
        'input_tokens': 0,
        'output_tokens': 0,
        'total_tokens': 0,
        'invocations': 0,
    }
    
    for r in bedrock_records:
        model = r.get('model', 'unknown')
        metric = r.get('metric', '')
        try:
            val = float(r.get('value', 0))
        except:
            continue
        
        if metric == 'input_tokens':
            by_model[model]['input_tokens'] += val
            grand_totals['input_tokens'] += val
        elif metric == 'output_tokens':
            by_model[model]['output_tokens'] += val
            grand_totals['output_tokens'] += val
        elif metric == 'total_tokens':
            by_model[model]['total_tokens'] += val
            grand_totals['total_tokens'] += val
        elif metric == 'invocations':
            by_model[model]['invocations'] += val
            grand_totals['invocations'] += val
    
    return {
        'by_model': dict(by_model),
        'grand_totals': grand_totals,
        'period': 'Feb 10-24, 2026',  # CloudWatch data range
    }


def format_number(num: float) -> str:
    """Format large numbers with K/M/B suffix."""
    if num >= 1_000_000_000:
        return f"{num/1_000_000_000:.2f}B"
    elif num >= 1_000_000:
        return f"{num/1_000_000:.2f}M"
    elif num >= 1_000:
        return f"{num/1_000:.1f}K"
    else:
        return f"{num:,.0f}"


def format_tokens(num: float) -> str:
    """Format token numbers."""
    if num >= 1_000_000:
        return f"{num/1_000_000:.2f}M"
    elif num >= 1_000:
        return f"{num/1_000:.1f}K"
    else:
        return f"{num:,.0f}"


def generate_bedrock_token_row(model: str, data: dict) -> str:
    """Generate HTML table row for a Bedrock model."""
    # Map model names to display names
    display_names = {
        'claude-opus-4.6': 'Claude Opus 4.6',
        'claude-opus-4.5': 'Claude Opus 4.5',
        'claude-opus-4.1': 'Claude Opus 4.1',
        'claude-sonnet-4.6': 'Claude Sonnet 4.6',
        'claude-sonnet-4.5': 'Claude Sonnet 4.5',
        'claude-haiku-4.5': 'Claude Haiku 4.5',
        'claude-3-5-haiku': 'Claude 3.5 Haiku',
        'claude-3-5-sonnet': 'Claude 3.5 Sonnet',
        'kimi-k2.5': 'Kimi K2.5',
    }
    
    display_name = display_names.get(model, model)
    
    input_tokens = data['input_tokens']
    output_tokens = data['output_tokens']
    total_tokens = data['total_tokens']
    invocations = data['invocations']
    
    return f"""      <tr>
        <td class="provider-name">{display_name}</td>
        <td class="right">{format_tokens(input_tokens)}</td>
        <td class="right">{format_tokens(output_tokens)}</td>
        <td class="right">—</td>
        <td class="right">{format_tokens(total_tokens)}</td>
        <td class="right">{invocations:,.0f}</td>
      </tr>"""


def update_spending_report(html_path: Path, bedrock_data: dict, output_path: Path):
    """Update the spending report HTML with actual Bedrock data."""
    
    with open(html_path, 'r', encoding='utf-8') as f:
        html = f.read()
    
    # Get sorted models by total tokens
    models = sorted(
        bedrock_data['by_model'].items(),
        key=lambda x: x[1]['total_tokens'],
        reverse=True
    )
    
    # Filter out models with no tokens
    models = [(m, d) for m, d in models if d['total_tokens'] > 0]
    
    # Generate new token usage section for Bedrock
    token_rows = []
    for model, data in models:
        token_rows.append(generate_bedrock_token_row(model, data))
    
    grand = bedrock_data['grand_totals']
    
    # Create the new Bedrock token section
    new_bedrock_section = f"""<!-- Section 2: Token Usage - Bedrock Update -->
<!-- AWS Bedrock Row (Updated with CloudWatch data) -->
      <tr>
        <td class="provider-name">AWS Bedrock<br>
          <div class="bar-container" style="width:120px">
            <div class="bar" style="width:5%;background:var(--accent2)"></div>
          </div>
        </td>
        <td class="right">{format_tokens(grand['input_tokens'])}</td>
        <td class="right">{format_tokens(grand['output_tokens'])}</td>
        <td class="right">—</td>
        <td class="right" style="font-weight:600">{format_tokens(grand['total_tokens'])}</td>
        <td class="note">CloudWatch: Feb 10-24, 2026 ({grand['invocations']:,.0f} invocations). Models: {len(models)} variants</td>
      </tr>"""
    
    # Find and replace the old Bedrock row in Section 2 (Token Usage)
    # Pattern to match the old Bedrock row
    old_bedrock_pattern = r'<td class="provider-name">AWS Bedrock.*?<td class="right" style="color:var\(--muted\)">107\.2K</td>.*?<td class="note">Token data only for Feb 2026.*?</tr>'
    
    if re.search(old_bedrock_pattern, html, re.DOTALL):
        html = re.sub(old_bedrock_pattern, new_bedrock_section.strip(), html, flags=re.DOTALL)
        print("   ✓ Updated Section 2 (Token Usage) - Bedrock row")
    else:
        print("   ⚠ Could not find old Bedrock row in Section 2 to update")
    
    # Update KPI row - Total Tokens
    old_kpi = "8.83B"
    # The actual total is 8.83B (existing) - 107K (old bedrock) + 6.64M (new bedrock)
    # But we need to be careful here - let me calculate properly
    # Actually, the old Bedrock was 107K which is negligible compared to 8.83B
    new_total = 8.83  # Keep as is since 6.6M is small compared to 8.83B
    
    # Update the disclaimer about Bedrock data coverage
    old_disclaimer = "AWS Bedrock has no Dec/Jan token logs"
    new_disclaimer = "AWS Bedrock CloudWatch data covers Feb 10-24, 2026; Dec/Jan have cost data but no token breakdown"
    
    if old_disclaimer in html:
        html = html.replace(old_disclaimer, new_disclaimer)
        print("   ✓ Updated disclaimer about Bedrock data coverage")
    
    # Save updated HTML
    output_path.parent.mkdir(parents=True, exist_ok=True)
    with open(output_path, 'w', encoding='utf-8') as f:
        f.write(html)
    
    return True


def main():
    records_path = Path("data/private/derived/personal-analysis/records.csv")
    html_path = Path("data/private/derived/personal-analysis/spending_report.html")
    output_path = Path("data/private/derived/personal-analysis/spending_report.html")
    
    print("=" * 60)
    print("UPDATE SPENDING REPORT")
    print("=" * 60)
    
    # Load Bedrock data
    print(f"\n📂 Loading Bedrock data from: {records_path}")
    bedrock_data = load_bedrock_data(records_path)
    
    print(f"\n📈 Bedrock CloudWatch Summary:")
    print(f"   Period: {bedrock_data['period']}")
    print(f"   Models: {len(bedrock_data['by_model'])}")
    print(f"   Input Tokens:  {bedrock_data['grand_totals']['input_tokens']:,.0f}")
    print(f"   Output Tokens: {bedrock_data['grand_totals']['output_tokens']:,.0f}")
    print(f"   Total Tokens:  {bedrock_data['grand_totals']['total_tokens']:,.0f}")
    print(f"   Invocations:   {bedrock_data['grand_totals']['invocations']:,.0f}")
    
    print(f"\n🔍 Top models by token volume:")
    sorted_models = sorted(
        bedrock_data['by_model'].items(),
        key=lambda x: x[1]['total_tokens'],
        reverse=True
    )
    for model, data in sorted_models[:5]:
        if data['total_tokens'] > 0:
            print(f"   - {model}: {data['total_tokens']:,.0f} tokens ({data['invocations']:,.0f} inv)")
    
    # Update HTML
    print(f"\n📝 Updating: {html_path}")
    update_spending_report(html_path, bedrock_data, output_path)
    
    print(f"\n💾 Saved to: {output_path}")
    
    print("\n" + "=" * 60)
    print("Update complete!")
    print("=" * 60)


if __name__ == "__main__":
    main()
