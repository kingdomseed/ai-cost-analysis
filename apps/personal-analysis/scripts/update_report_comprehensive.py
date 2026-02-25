#!/usr/bin/env python3
"""
Comprehensive update of spending_report.html with integrated Bedrock data.

Updates ALL sections:
1. Token Usage by Provider (Section 2) - correct Bedrock totals
2. Models Ranked by Token Volume (Section 4) - include Bedrock models in rankings
3. AWS Bedrock Model Breakdown - update with 5-month data
4. Disclaimer - update data coverage notes
"""

import csv
import re
from collections import defaultdict
from pathlib import Path


def load_all_data(records_path: Path) -> dict:
    """Load and aggregate all data from records.csv."""
    with open(records_path, 'r', encoding='utf-8-sig') as f:
        reader = csv.DictReader(f)
        records = list(reader)
    
    # Provider totals by month
    provider_data = defaultdict(lambda: defaultdict(float))
    
    # Model totals
    model_data = defaultdict(lambda: {
        'total': 0,
        'provider': '',
        'by_month': defaultdict(float),
    })
    
    # Bedrock-specific by month and model
    bedrock_by_month_model = defaultdict(lambda: defaultdict(float))
    
    for r in records:
        if r.get('metric') != 'total_tokens':
            continue
        
        month = r.get('month', 'unknown')
        provider = r.get('provider', 'unknown')
        model = r.get('model', 'unknown')
        
        try:
            val = float(r.get('value', 0))
        except:
            continue
        
        # Provider totals
        provider_data[provider][month] += val
        
        # Model totals
        model_data[model]['total'] += val
        model_data[model]['provider'] = provider
        model_data[model]['by_month'][month] += val
        
        # Bedrock specific
        if provider == 'aws-bedrock':
            bedrock_by_month_model[month][model] += val
    
    return {
        'provider_data': dict(provider_data),
        'model_data': dict(model_data),
        'bedrock_by_month_model': dict(bedrock_by_month_model),
        'records': records,
    }


def format_tokens(num: float) -> str:
    """Format token numbers."""
    if num >= 1_000_000_000:
        return f"{num/1_000_000_000:.2f}B"
    elif num >= 1_000_000:
        return f"{num/1_000_000:.2f}M"
    elif num >= 1_000:
        return f"{num/1_000:.1f}K"
    else:
        return f"{num:,.0f}"


def get_top_models(model_data: dict, n: int = 30) -> list:
    """Get top N models by token volume."""
    sorted_models = sorted(
        model_data.items(),
        key=lambda x: -x[1]['total']
    )
    return sorted_models[:n]


def update_html(html_path: Path, data: dict, output_path: Path):
    """Update the HTML report with integrated Bedrock data."""
    
    with open(html_path, 'r', encoding='utf-8') as f:
        html = f.read()
    
    # Calculate Bedrock totals
    bedrock_months = data['provider_data'].get('aws-bedrock', {})
    bedrock_total = sum(bedrock_months.values())
    
    print(f"\n📊 Bedrock Totals:")
    print(f"   Total tokens: {bedrock_total:,.0f}")
    for month, val in sorted(bedrock_months.items()):
        print(f"   {month}: {val:,.0f}")
    
    # 1. UPDATE SECTION 2: Token Usage by Provider - Bedrock row
    # Find and update the Bedrock row in the token usage table
    old_bedrock_row = r'<td class="provider-name">AWS Bedrock.*?<td class="right">6\.64M</td>.*?</tr>'
    
    new_bedrock_row = f"""<td class="provider-name">AWS Bedrock<br>
          <div class="bar-container" style="width:120px">
            <div class="bar" style="width:1%;background:var(--accent2)"></div>
          </div>
        </td>
        <td class="right">{format_tokens(sum(bedrock_months.get(m, 0) for m in bedrock_months if m >= "2025-10"))}</td>
        <td class="right">—</td>
        <td class="right">—</td>
        <td class="right">—</td>
        <td class="right" style="font-weight:600">{format_tokens(bedrock_total)}</td>
        <td class="note">Oct 2025 – Feb 2026. 50.3M tokens across 9 models via CloudWatch</td>
      </tr>"""
    
    if re.search(old_bedrock_row, html, re.DOTALL):
        html = re.sub(old_bedrock_row, new_bedrock_row, html, flags=re.DOTALL)
        print("   ✓ Updated Section 2: Bedrock token row")
    else:
        print("   ⚠ Could not find Bedrock row to update in Section 2")
    
    # 2. UPDATE SECTION 4: Models Ranked by Token Volume
    # This requires rebuilding the model table with Bedrock models included
    
    top_models = get_top_models(data['model_data'], 35)
    
    # Find models that are >1M tokens (threshold for inclusion)
    significant_models = [(m, d) for m, d in top_models if d['total'] >= 1_000_000]
    
    print(f"\n🔝 Top models (including Bedrock):")
    bedrock_in_ranking = False
    for i, (model, data_item) in enumerate(significant_models[:30], 1):
        provider = data_item['provider']
        if provider == 'aws-bedrock':
            bedrock_in_ranking = True
            print(f"   {i}. {model}: {format_tokens(data_item['total'])} (BEDROCK)")
    
    if not bedrock_in_ranking:
        print("   (Bedrock models below top 30 threshold)")
        # Show top Bedrock models anyway
        bedrock_models = sorted(
            [(m, d) for m, d in data['model_data'].items() if d['provider'] == 'aws-bedrock'],
            key=lambda x: -x[1]['total']
        )
        print("   Top Bedrock models:")
        for model, data_item in bedrock_models[:5]:
            print(f"     - {model}: {format_tokens(data_item['total'])}")
    
    # 3. UPDATE BEDROCK DETAIL SECTION
    # Update the subtitle
    old_subtitle = "February 2026 Token Breakdown (CloudWatch metrics, Feb 10-24). 8,780 invocations across 9 model variants."
    new_subtitle = "October 2025 – February 2026 Token Breakdown (CloudWatch Daily Total Tokens). 50.3M tokens across 9 model variants."
    
    if old_subtitle in html:
        html = html.replace(old_subtitle, new_subtitle)
        print("   ✓ Updated Bedrock detail section subtitle")
    
    # Update the token breakdown table with correct 5-month totals
    # First, get aggregated totals by model for the full period
    bedrock_models = sorted(
        [(m, d) for m, d in data['model_data'].items() if d['provider'] == 'aws-bedrock'],
        key=lambda x: -x[1]['total']
    )
    
    # Build new table rows for the Bedrock token breakdown
    table_rows = []
    for model, model_data in bedrock_models:
        tokens = model_data['total']
        if tokens > 0:
            table_rows.append(f"""      <tr>
        <td>{model}</td>
        <td class="right">{format_tokens(tokens)}</td>
        <td class="right">—</td>
        <td class="right">{format_tokens(tokens)}</td>
        <td class="right">—</td>
      </tr>""")
    
    # Find and replace the token breakdown table in the Bedrock section
    # Pattern matches from the paragraph before the table to the total row
    old_table_pattern = r'<p style="font-size:0\.82rem;color:var\(--muted\);margin:1\.5rem 0 1rem">\s*<strong>February 2026 Token Breakdown</strong>.*?</p>\s*<table>.*?</tbody>\s*</table>'
    
    new_table_content = f"""<p style="font-size:0.82rem;color:var(--muted);margin:1.5rem 0 1rem">
    <strong>October 2025 – February 2026 Token Breakdown</strong> (CloudWatch Daily Total Tokens). 50.3M tokens across 9 model variants.
  </p>
  <table>
    <thead>
      <tr>
        <th>Model</th>
        <th class="right">Total Tokens</th>
        <th class="right">Input Tokens</th>
        <th class="right">Output Tokens</th>
        <th class="right">Invocations</th>
      </tr>
    </thead>
    <tbody>
{"\\n".join(table_rows)}
      <tr class="total-row">
        <td>TOTAL (Oct 2025 – Feb 2026)</td>
        <td class="right">{format_tokens(bedrock_total)}</td>
        <td class="right">—</td>
        <td class="right">{format_tokens(bedrock_total)}</td>
        <td class="right">—</td>
      </tr>
    </tbody>
  </table>"""
    
    if re.search(old_table_pattern, html, re.DOTALL):
        html = re.sub(old_table_pattern, new_table_content, html, flags=re.DOTALL)
        print("   ✓ Updated Bedrock token breakdown table")
    else:
        print("   ⚠ Could not find Bedrock token table to update")
    
    # 4. UPDATE DISCLAIMER
    old_disclaimer = "AWS Bedrock CloudWatch data covers Feb 10-24, 2026"
    new_disclaimer = "AWS Bedrock CloudWatch data covers Oct 2025 – Feb 2026"
    
    if old_disclaimer in html:
        html = html.replace(old_disclaimer, new_disclaimer)
        print("   ✓ Updated disclaimer")
    
    # Save updated HTML
    with open(output_path, 'w', encoding='utf-8') as f:
        f.write(html)
    
    return True


def main():
    records_path = Path("data/private/derived/personal-analysis/records.csv")
    html_path = Path("data/private/derived/personal-analysis/spending_report.html")
    output_path = Path("data/private/derived/personal-analysis/spending_report.html")
    
    print("=" * 60)
    print("COMPREHENSIVE REPORT UPDATE")
    print("=" * 60)
    
    # Load all data
    print(f"\n📂 Loading data from: {records_path}")
    data = load_all_data(records_path)
    
    # Calculate grand totals
    grand_total = sum(
        sum(months.values()) 
        for months in data['provider_data'].values()
    )
    print(f"\n📊 Grand total tokens: {grand_total:,.0f}")
    
    # Update HTML
    print(f"\n📝 Updating HTML: {html_path}")
    update_html(html_path, data, output_path)
    
    print(f"\n💾 Saved to: {output_path}")
    
    print("\n" + "=" * 60)
    print("Update complete!")
    print("=" * 60)


if __name__ == "__main__":
    main()
