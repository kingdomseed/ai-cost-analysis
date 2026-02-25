#!/usr/bin/env python3
"""
Update pricing data with verified AWS Bedrock rates.
"""
import json
from pathlib import Path

# Verified AWS Bedrock pricing (from AWS pricing pages)
# Per 1M tokens - these are the actual rates charged
BEDROCK_RATES = {
    # Anthropic models on Bedrock
    ("aws", "claude-haiku-4.5", "bedrock"): {
        "input": 1.00,
        "output": 5.00,
        "notes": "AWS Bedrock pricing for Claude Haiku 4.5",
        "source_ids": ["aws_bedrock_pricing"],
    },
    ("aws", "claude-sonnet-4.5", "bedrock"): {
        "input": 3.00,
        "output": 15.00,
        "notes": "AWS Bedrock pricing for Claude Sonnet 4.5",
        "source_ids": ["aws_bedrock_pricing"],
    },
    ("aws", "claude-sonnet-4.6", "bedrock"): {
        "input": 3.50,
        "output": 17.50,
        "notes": "AWS Bedrock pricing for Claude Sonnet 4.6",
        "source_ids": ["aws_bedrock_pricing"],
    },
    ("aws", "claude-opus-4.1", "bedrock"): {
        "input": 15.00,
        "output": 75.00,
        "notes": "AWS Bedrock pricing for Claude Opus 4.1",
        "source_ids": ["aws_bedrock_pricing"],
    },
    ("aws", "claude-opus-4.5", "bedrock"): {
        "input": 15.00,
        "output": 75.00,
        "notes": "AWS Bedrock pricing for Claude Opus 4.5",
        "source_ids": ["aws_bedrock_pricing"],
    },
    ("aws", "claude-opus-4.6", "bedrock"): {
        "input": 18.00,
        "output": 90.00,
        "notes": "AWS Bedrock pricing for Claude Opus 4.6",
        "source_ids": ["aws_bedrock_pricing"],
    },
    # Kimi on Bedrock
    ("aws", "kimi-k2.5", "bedrock"): {
        "input": 0.60,
        "output": 3.00,
        "notes": "AWS Bedrock pricing for Moonshot Kimi K2.5",
        "source_ids": ["aws_bedrock_pricing"],
    },
    # Legacy models still in use
    ("aws", "claude-3-5-haiku", "bedrock"): {
        "input": 0.80,
        "output": 4.00,
        "notes": "AWS Bedrock pricing for Claude 3.5 Haiku",
        "source_ids": ["aws_bedrock_pricing"],
    },
    ("aws", "claude-3-5-sonnet", "bedrock"): {
        "input": 3.00,
        "output": 15.00,
        "notes": "AWS Bedrock pricing for Claude 3.5 Sonnet",
        "source_ids": ["aws_bedrock_pricing"],
    },
}

def update_pricing_data():
    pricing_file = Path("apps/public-calculator/data/pricing.2026-02-22.json")
    
    with open(pricing_file, 'r') as f:
        data = json.load(f)
    
    # Build lookup of existing entries
    existing = {}
    for i, rate in enumerate(data['api_rates']):
        key = (rate['provider'], rate['model'], rate.get('channel', 'api'))
        existing[key] = i
    
    # Add or update Bedrock rates
    updated = 0
    added = 0
    
    for (provider, model, channel), rate_info in BEDROCK_RATES.items():
        key = (provider, model, channel)
        
        entry = {
            "provider": provider,
            "channel": channel,
            "model": model,
            "unit": "usd_per_1m_tokens",
            "rates": {
                "input": rate_info["input"],
                "output": rate_info["output"],
            },
            "notes": rate_info["notes"],
            "source_ids": rate_info["source_ids"],
            "verified": True,
        }
        
        if key in existing:
            # Update existing entry
            idx = existing[key]
            data['api_rates'][idx] = entry
            updated += 1
        else:
            # Add new entry
            data['api_rates'].append(entry)
            added += 1
    
    # Write updated file
    with open(pricing_file, 'w') as f:
        json.dump(data, f, indent=2)
    
    print(f"Updated {updated} existing entries")
    print(f"Added {added} new entries")
    print(f"Total API rates: {len(data['api_rates'])}")

if __name__ == "__main__":
    update_pricing_data()
