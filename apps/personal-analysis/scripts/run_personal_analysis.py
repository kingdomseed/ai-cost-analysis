#!/usr/bin/env python3
import argparse
import csv
import json
import math
import re
import sys
from collections import defaultdict
from datetime import datetime, timezone
from pathlib import Path
from typing import Dict, Iterable, List, Optional, Tuple


def parse_iso_month(value: str) -> Optional[str]:
    if not value:
        return None
    value = value.strip().strip('"')
    try:
        if value.endswith("Z"):
            value = value[:-1] + "+00:00"
        dt = datetime.fromisoformat(value)
        return dt.strftime("%Y-%m")
    except ValueError:
        pass
    for fmt in ("%Y-%m-%d", "%m/%d/%Y", "%m/%d/%y"):
        try:
            dt = datetime.strptime(value, fmt)
            return dt.strftime("%Y-%m")
        except ValueError:
            continue
    return None


def parse_year_from_month(month: str) -> str:
    return month.split("-")[0]


def to_number(value: str) -> Optional[float]:
    if value is None:
        return None
    if isinstance(value, (int, float)):
        return float(value)
    text = str(value).strip().replace(",", "")
    if text == "" or text.lower() in {"nan", "null", "none"}:
        return None
    try:
        return float(text)
    except ValueError:
        return None


def provider_from_model(model: str) -> str:
    model_lower = (model or "").lower()
    if "anthropic" in model_lower or "claude" in model_lower:
        return "anthropic"
    if "openai" in model_lower or "gpt" in model_lower:
        return "openai"
    if "gemini" in model_lower or "google" in model_lower:
        return "google"
    if "kimi" in model_lower or "moonshot" in model_lower:
        return "moonshot"
    if "bedrock" in model_lower or "aws" in model_lower:
        return "aws"
    return "unknown"


def normalize_name(value: str) -> str:
    return re.sub(r"[^a-z0-9]", "", (value or "").lower())


def normalize_meter_name(value: str) -> str:
    text = (value or "").lower()
    text = re.sub(r"\s+", " ", text)
    text = text.replace("glbl", "global").replace("regnl", "regional")
    text = re.sub(r"\b(global|regional)\b", "", text)
    text = re.sub(r"\s+", " ", text).strip()
    return text


def load_latest_pricing_snapshot() -> Optional[Dict]:
    data_dir = Path("apps/public-calculator/data")
    candidates = list(data_dir.glob("pricing.*.json"))
    if not candidates:
        return None

    dated = []
    for path in candidates:
        stem = path.name.replace("pricing.", "").replace(".json", "")
        if re.match(r"\d{4}-\d{2}-\d{2}$", stem):
            dated.append((stem, path))
    if dated:
        dated.sort(key=lambda item: item[0])
        latest = dated[-1][1]
    else:
        candidates.sort()
        latest = candidates[-1]
    with latest.open("r", encoding="utf-8") as handle:
        return json.load(handle)


def build_pricing_lookup(pricing: Dict) -> Dict[str, List[Tuple[str, Dict[str, float], str]]]:
    lookup: Dict[str, List[Tuple[str, Dict[str, float], str]]] = defaultdict(list)
    for rate in pricing.get("api_rates", []):
        provider = rate.get("provider")
        model = rate.get("model")
        rates = {}
        if "rates" in rate and isinstance(rate["rates"], dict):
            rates = rate["rates"]
        elif "tiers" in rate and rate["tiers"]:
            rates = rate["tiers"][0].get("rates", {})
        if not provider or not model or not rates:
            continue
        lookup[provider].append((normalize_name(model), rates, model))
    return lookup


def match_pricing_rates(provider: str, raw_model: str, lookup: Dict[str, List[Tuple[str, Dict[str, float], str]]]) -> Tuple[Optional[Dict[str, float]], Optional[str]]:
    if provider not in lookup:
        return None, None
    raw_norm = normalize_name(raw_model)
    for model_norm, rates, model_name in lookup[provider]:
        if model_norm and model_norm in raw_norm:
            return rates, "direct"

    raw_lower = (raw_model or "").lower()
    raw_lower = raw_lower.replace("us.", "").replace("anthropic.", "").replace("openai.", "")
    raw_lower = re.sub(r"-20\d{6,8}.*$", "", raw_lower)
    raw_lower = re.sub(r"v\d+$", "", raw_lower)
    base_norm = normalize_name(raw_lower)
    if not base_norm:
        return None, None

    candidates: List[Tuple[float, Dict[str, float]]] = []
    for model_norm, rates, model_name in lookup[provider]:
        if model_norm.startswith(base_norm):
            version_matches = re.findall(r"(\d+(?:\.\d+)?)", model_name)
            version = float(version_matches[-1]) if version_matches else 0.0
            candidates.append((version, rates))

    if candidates:
        candidates.sort(key=lambda item: item[0], reverse=True)
        return candidates[0][1], "family"

    # Fallback: map to closest known family keyword if no versioned match exists
    family_keywords = ["claudesonnet", "claudeopus", "claudehaiku", "gpt5", "gpt4o", "gemini", "kimi"]
    raw_lower_full = (raw_model or "").lower()
    keyword_hits = []
    if "sonnet" in raw_lower_full:
        keyword_hits.append("claudesonnet")
    if "opus" in raw_lower_full:
        keyword_hits.append("claudeopus")
    if "haiku" in raw_lower_full:
        keyword_hits.append("claudehaiku")
    if "gpt-5" in raw_lower_full or "gpt5" in raw_lower_full:
        keyword_hits.append("gpt5")
    if "gpt-4o" in raw_lower_full or "gpt4o" in raw_lower_full:
        keyword_hits.append("gpt4o")
    if "gemini" in raw_lower_full:
        keyword_hits.append("gemini")
    if "kimi" in raw_lower_full:
        keyword_hits.append("kimi")

    for keyword in family_keywords:
        if keyword in base_norm or keyword in keyword_hits:
            family_candidates: List[Tuple[float, Dict[str, float]]] = []
            for model_norm, rates, model_name in lookup[provider]:
                if keyword in model_norm:
                    version_matches = re.findall(r"(\d+(?:\.\d+)?)", model_name)
                    version = float(version_matches[-1]) if version_matches else 0.0
                    family_candidates.append((version, rates))
            if family_candidates:
                family_candidates.sort(key=lambda item: item[0], reverse=True)
                return family_candidates[0][1], "family_keyword"

    return None, None


def add_record(
    records: List[Dict[str, object]],
    month: str,
    provider: str,
    source: str,
    model: str,
    metric: str,
    value: float,
    unit: str,
    estimated: bool = False,
    notes: Optional[str] = None,
) -> None:
    if month is None or value is None:
        return
    records.append(
        {
            "month": month,
            "year": parse_year_from_month(month),
            "provider": provider,
            "source": source,
            "model": model,
            "metric": metric,
            "value": value,
            "unit": unit,
            "estimated": bool(estimated),
            "notes": notes or "",
        }
    )


def parse_anthropic_csv(path: Path, records: List[Dict[str, object]], report: Dict) -> None:
    with path.open("r", encoding="utf-8-sig") as handle:
        reader = csv.DictReader(handle)
        for row in reader:
            month = parse_iso_month(row.get("usage_date_utc", ""))
            model = row.get("model_version", "") or "unknown"
            input_no_cache = to_number(row.get("usage_input_tokens_no_cache"))
            input_write_5m = to_number(row.get("usage_input_tokens_cache_write_5m"))
            input_write_1h = to_number(row.get("usage_input_tokens_cache_write_1h"))
            cache_read = to_number(row.get("usage_input_tokens_cache_read"))
            output_tokens = to_number(row.get("usage_output_tokens"))

            input_tokens = sum(
                v for v in [input_no_cache, input_write_5m, input_write_1h] if v is not None
            )
            total_tokens = sum(
                v for v in [input_tokens, cache_read, output_tokens] if v is not None
            )

            if input_no_cache is not None:
                add_record(records, month, "anthropic", "anthropic_api", model, "input_tokens_no_cache", input_no_cache, "tokens")
            if input_write_5m is not None:
                add_record(records, month, "anthropic", "anthropic_api", model, "cache_write_tokens_5m", input_write_5m, "tokens")
            if input_write_1h is not None:
                add_record(records, month, "anthropic", "anthropic_api", model, "cache_write_tokens_1h", input_write_1h, "tokens")
            add_record(records, month, "anthropic", "anthropic_api", model, "input_tokens", input_tokens, "tokens")
            if cache_read is not None:
                add_record(records, month, "anthropic", "anthropic_api", model, "cache_read_tokens", cache_read, "tokens")
            if output_tokens is not None:
                add_record(records, month, "anthropic", "anthropic_api", model, "output_tokens", output_tokens, "tokens")
            add_record(records, month, "anthropic", "anthropic_api", model, "total_tokens", total_tokens, "tokens")

    report["files"].append({"source": "anthropic_api", "path": str(path)})


def parse_cursor_csv(path: Path, records: List[Dict[str, object]], report: Dict) -> None:
    with path.open("r", encoding="utf-8-sig") as handle:
        reader = csv.DictReader(handle)
        for row in reader:
            month = parse_iso_month(row.get("Date", ""))
            model = row.get("Model", "") or "unknown"
            provider = provider_from_model(model)

            input_with_cache = to_number(row.get("Input (w/ Cache Write)"))
            input_without_cache = to_number(row.get("Input (w/o Cache Write)"))
            cache_read = to_number(row.get("Cache Read"))
            output_tokens = to_number(row.get("Output Tokens"))
            total_tokens = to_number(row.get("Total Tokens"))
            requests = to_number(row.get("Requests"))

            if input_with_cache is not None:
                add_record(records, month, provider, "cursor", model, "input_tokens_with_cache_write", input_with_cache, "tokens")
            if input_without_cache is not None:
                add_record(records, month, provider, "cursor", model, "input_tokens_without_cache_write", input_without_cache, "tokens")
            if cache_read is not None:
                add_record(records, month, provider, "cursor", model, "cache_read_tokens", cache_read, "tokens")
            if output_tokens is not None:
                add_record(records, month, provider, "cursor", model, "output_tokens", output_tokens, "tokens")
            if total_tokens is not None:
                add_record(records, month, provider, "cursor", model, "total_tokens", total_tokens, "tokens")
            if requests is not None:
                add_record(records, month, provider, "cursor", model, "requests", requests, "requests")

    report["files"].append({"source": "cursor", "path": str(path)})


def parse_devin_json(path: Path, records: List[Dict[str, object]], report: Dict) -> None:
    with path.open("r", encoding="utf-8") as handle:
        payload = json.load(handle)
    sessions = payload.get("sessions", [])
    for session in sessions:
        created_at = session.get("created_at", "")
        month = parse_iso_month(created_at)
        acu_used = to_number(session.get("acu_used"))
        if acu_used is None:
            continue
        add_record(records, month, "devin", "devin", "devin", "acu_used", acu_used, "acu")

    report["files"].append({"source": "devin", "path": str(path)})


def parse_azure_csv(path: Path, records: List[Dict[str, object]], report: Dict) -> None:
    with path.open("r", encoding="utf-8-sig") as handle:
        rows = list(csv.reader(handle))

    rate_samples: Dict[str, List[float]] = defaultdict(list)
    for row in rows:
        if not row or len(row) < 9:
            continue
        meter_name = row[7]
        quantity = to_number(row[8])
        cost = to_number(row[9]) if len(row) > 9 else None
        if quantity and cost and not math.isclose(cost, 0.0):
            key = normalize_meter_name(meter_name)
            rate_samples[key].append(cost / quantity)

    rate_by_meter = {}
    for key, samples in rate_samples.items():
        rate_by_meter[key] = sum(samples) / len(samples)

    for row in rows:
        if not row:
            continue
        if len(row) < 9:
            continue
        date_value = row[2]
        month = parse_iso_month(date_value)
        meter_name = row[7]
        quantity = to_number(row[8])
        cost = to_number(row[9]) if len(row) > 9 else None
        if quantity is not None:
            meter_lower = (meter_name or "").lower()
            tokens = None
            assumed_unit = None
            if "token" in meter_lower:
                if "1m" in meter_lower:
                    tokens = quantity * 1_000_000
                elif "1k" in meter_lower:
                    tokens = quantity * 1_000
                else:
                    # Azure Foundry meters often use 1K tokens even when the meter name omits the unit.
                    tokens = quantity * 1_000
                    assumed_unit = "1k_tokens_assumed"
            if tokens is not None:
                metric = "total_tokens"
                if "inp" in meter_lower or "input" in meter_lower:
                    metric = "input_tokens"
                if "out" in meter_lower or "output" in meter_lower:
                    metric = "output_tokens"
                if "cache" in meter_lower and "read" in meter_lower:
                    metric = "cache_read_tokens"
                note = "Azure Foundry meter quantity converted to tokens"
                if assumed_unit:
                    note += f" ({assumed_unit})"
                add_record(
                    records,
                    month,
                    "azure",
                    "azure_foundry",
                    meter_name or "unknown",
                    metric,
                    tokens,
                    "tokens",
                    estimated=bool(assumed_unit),
                    notes=note,
                )
                add_record(
                    records,
                    month,
                    "azure",
                    "azure_foundry",
                    meter_name or "unknown",
                    "total_tokens",
                    tokens,
                    "tokens",
                    estimated=bool(assumed_unit),
                    notes=note,
                )
                if (cost is None or math.isclose(cost, 0.0)) and quantity is not None:
                    key = normalize_meter_name(meter_name)
                    rate = rate_by_meter.get(key)
                    if rate:
                        add_record(
                            records,
                            month,
                            "azure",
                            "azure_foundry",
                            meter_name or "unknown",
                            "estimated_api_cost_usd",
                            quantity * rate,
                            "usd",
                            estimated=True,
                            notes="Estimated from Azure export-derived rate (cost/quantity)",
                        )
            else:
                add_record(
                    records,
                    month,
                    "azure",
                    "azure_foundry",
                    meter_name or "unknown",
                    "meter_quantity",
                    quantity,
                    "units",
                    notes="Azure Foundry export quantity (unit depends on meter)",
                )
            if cost is not None and not math.isclose(cost, 0.0):
                add_record(
                    records,
                    month,
                    "azure",
                    "azure_foundry",
                    meter_name or "unknown",
                    "cost_usd",
                    cost,
                    "usd",
                    notes="Azure Foundry export cost field",
                )

    report["files"].append({"source": "azure_foundry", "path": str(path)})


def parse_bedrock_derived(path: Path, records: List[Dict[str, object]], report: Dict) -> None:
    with path.open("r", encoding="utf-8-sig") as handle:
        reader = csv.DictReader(handle)
        for row in reader:
            month = row.get("UsageMonth")
            model = row.get("ModelLabel", "") or "unknown"
            usage_amount = to_number(row.get("lineItem/UsageAmount"))
            cost = to_number(row.get("lineItem/UnblendedCost"))

            if usage_amount is not None:
                add_record(
                    records,
                    month,
                    "aws-bedrock",
                    "aws-bedrock",
                    model,
                    "usage_amount",
                    usage_amount,
                    "units",
                    notes="Bedrock usage amount (unit depends on meter)",
                )
            if cost is not None:
                add_record(records, month, "aws-bedrock", "aws-bedrock", model, "cost_usd", cost, "usd")

    report["files"].append({"source": "aws_bedrock_derived", "path": str(path)})


def parse_bedrock_cost_report(path: Path, records: List[Dict[str, object]], report: Dict) -> None:
    with path.open("r", encoding="utf-8-sig") as handle:
        reader = csv.DictReader(handle)
        for row in reader:
            if row.get("product/servicecode") != "AmazonBedrock" and row.get("product/servicename") != "Amazon Bedrock":
                continue
            month = parse_iso_month(row.get("lineItem/UsageStartDate", ""))
            usage_amount = to_number(row.get("lineItem/UsageAmount"))
            unit = (row.get("pricing/unit") or "").lower()
            usage_type = (row.get("lineItem/UsageType") or "").lower()
            line_item_type = (row.get("lineItem/LineItemType") or "").lower()

            model = usage_type
            for suffix in ["-input-tokens", "-output-tokens", "-cache-read", "-cache-write"]:
                if suffix in model:
                    model = model.replace(suffix, "")
            model = model.replace("use1-", "").replace("usw2-", "").strip()
            model = model or row.get("product/model") or "unknown"

            tokens = None
            if "1k tokens" in unit:
                tokens = usage_amount * 1_000 if usage_amount is not None else None
            elif "1m tokens" in unit:
                tokens = usage_amount * 1_000_000 if usage_amount is not None else None

            metric = "total_tokens"
            if "input" in usage_type:
                metric = "input_tokens"
            elif "output" in usage_type:
                metric = "output_tokens"
            elif "cache" in usage_type and "read" in usage_type:
                metric = "cache_read_tokens"
            elif "cache" in usage_type and "write" in usage_type:
                metric = "cache_write_tokens"

            if tokens is not None and line_item_type != "credit":
                add_record(records, month, "aws-bedrock", "aws-bedrock", model, metric, tokens, "tokens")
                add_record(records, month, "aws-bedrock", "aws-bedrock", model, "total_tokens", tokens, "tokens")

            cost = to_number(row.get("lineItem/UnblendedCost"))
            if cost is not None:
                add_record(records, month, "aws-bedrock", "aws-bedrock", model, "cost_usd", cost, "usd")

    report["files"].append({"source": "aws_bedrock_raw", "path": str(path)})


def add_estimated_api_costs(records: List[Dict[str, object]], report: Dict, ratio_input: int = 3, ratio_output: int = 1) -> None:
    pricing = load_latest_pricing_snapshot()
    if not pricing:
        report["warnings"].append("Pricing snapshot not found; skipping estimated API costs.")
        return

    lookup = build_pricing_lookup(pricing)

    grouped: Dict[Tuple[str, str, str, str], Dict[str, float]] = defaultdict(lambda: defaultdict(float))
    for record in records:
        key = (record["month"], record["provider"], record["source"], record["model"])
        metric = record["metric"]
        grouped[key][metric] += float(record["value"])

    for (month, provider, source, model), metrics in grouped.items():
        rates, match_kind = match_pricing_rates(provider, model, lookup)
        if not rates:
            continue

        input_tokens = (
            metrics.get("input_tokens_no_cache", 0.0)
            + metrics.get("input_tokens_without_cache_write", 0.0)
            + metrics.get("input_tokens", 0.0)
        )
        output_tokens = metrics.get("output_tokens", 0.0)
        cache_read_tokens = metrics.get("cache_read_tokens", 0.0)
        total_tokens = metrics.get("total_tokens", 0.0)
        cache_write_5m_tokens = metrics.get("cache_write_tokens_5m", 0.0) + metrics.get("input_tokens_with_cache_write", 0.0)
        cache_write_1h_tokens = metrics.get("cache_write_tokens_1h", 0.0)

        used_ratio = False
        if input_tokens == 0.0 and output_tokens == 0.0 and total_tokens > 0.0:
            ratio_total = ratio_input + ratio_output
            input_tokens = total_tokens * (ratio_input / ratio_total)
            output_tokens = total_tokens * (ratio_output / ratio_total)
            used_ratio = True

        if input_tokens == 0.0 and output_tokens == 0.0 and cache_read_tokens == 0.0:
            continue

        input_rate = rates.get("input") or 0.0
        output_rate = rates.get("output") or 0.0
        cache_rate = rates.get("cache_read_5m") or rates.get("cache_read") or 0.0
        cache_write_5m_rate = rates.get("cache_write_5m") or input_rate
        cache_write_1h_rate = rates.get("cache_write_1h") or cache_write_5m_rate

        estimated_cost = (input_tokens / 1_000_000) * input_rate
        estimated_cost += (cache_write_5m_tokens / 1_000_000) * cache_write_5m_rate
        estimated_cost += (cache_write_1h_tokens / 1_000_000) * cache_write_1h_rate
        estimated_cost += (output_tokens / 1_000_000) * output_rate
        estimated_cost += (cache_read_tokens / 1_000_000) * cache_rate

        if estimated_cost <= 0:
            continue

        note_parts = ["Estimated from public API pricing snapshot"]
        if used_ratio:
            note_parts.append(f"Input/output split assumed {ratio_input}:{ratio_output}")
        if match_kind == "family":
            note_parts.append("Model matched by family (no exact version)")
        if match_kind == "family_keyword":
            note_parts.append("Model matched by family keyword (no exact version)")

        add_record(
            records,
            month,
            provider,
            source,
            model,
            "estimated_api_cost_usd",
            estimated_cost,
            "usd",
            estimated=True,
            notes="; ".join(note_parts),
        )


def write_csv(path: Path, rows: Iterable[Dict[str, object]], fieldnames: List[str]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", encoding="utf-8", newline="") as handle:
        writer = csv.DictWriter(handle, fieldnames=fieldnames)
        writer.writeheader()
        for row in rows:
            writer.writerow(row)


def aggregate(records: List[Dict[str, object]], keys: Tuple[str, ...]) -> List[Dict[str, object]]:
    totals: Dict[Tuple, float] = defaultdict(float)
    for record in records:
        key = tuple(record[k] for k in keys)
        totals[key] += float(record["value"])

    aggregated = []
    for key, total in totals.items():
        row = {k: key[idx] for idx, k in enumerate(keys)}
        row["value"] = total
        aggregated.append(row)
    return aggregated


def main() -> int:
    parser = argparse.ArgumentParser(description="Run personal analysis rollups.")
    parser.add_argument("--raw-dir", default="data/private/raw", help="Path to raw exports")
    parser.add_argument("--derived-dir", default="data/private/derived/personal-analysis", help="Output directory")
    args = parser.parse_args()

    raw_dir = Path(args.raw_dir)
    derived_dir = Path(args.derived_dir)
    records: List[Dict[str, object]] = []
    report = {"generated_at": datetime.now(timezone.utc).isoformat().replace("+00:00", "Z"), "files": [], "warnings": []}

    for path in raw_dir.glob("anthropic/*.csv"):
        parse_anthropic_csv(path, records, report)

    for path in raw_dir.glob("cursor/*.csv"):
        parse_cursor_csv(path, records, report)

    for path in raw_dir.glob("devin/*.json"):
        parse_devin_json(path, records, report)

    for path in raw_dir.glob("azure/*.csv"):
        parse_azure_csv(path, records, report)

    bedrock_raw = Path("data/private/raw/aws-bedrock/CostReportBedrock-00001.csv")
    if bedrock_raw.exists():
        parse_bedrock_cost_report(bedrock_raw, records, report)
    else:
        bedrock_derived = Path("data/private/derived/aws-bedrock/bedrock_feb_2026_usage_by_model.csv")
        if bedrock_derived.exists():
            parse_bedrock_derived(bedrock_derived, records, report)
        else:
            report["warnings"].append("Bedrock raw or derived file not found; skipping.")

    add_estimated_api_costs(records, report)

    records_sorted = sorted(
        records,
        key=lambda r: (r["month"], r["provider"], r["source"], r["model"], r["metric"]),
    )

    record_fields = ["month", "year", "provider", "source", "model", "metric", "value", "unit", "estimated", "notes"]
    write_csv(derived_dir / "records.csv", records_sorted, record_fields)

    monthly_by_model = aggregate(records, ("month", "provider", "source", "model", "metric", "unit", "estimated"))
    write_csv(
        derived_dir / "monthly_by_model.csv",
        sorted(monthly_by_model, key=lambda r: (r["month"], r["provider"], r["source"], r["model"], r["metric"])),
        ["month", "provider", "source", "model", "metric", "unit", "estimated", "value"],
    )

    monthly_by_provider = aggregate(records, ("month", "provider", "metric", "unit", "estimated"))
    write_csv(
        derived_dir / "monthly_by_provider.csv",
        sorted(monthly_by_provider, key=lambda r: (r["month"], r["provider"], r["metric"])),
        ["month", "provider", "metric", "unit", "estimated", "value"],
    )

    yearly_summary = aggregate(records, ("year", "metric", "unit", "estimated"))
    write_csv(
        derived_dir / "yearly_summary.csv",
        sorted(yearly_summary, key=lambda r: (r["year"], r["metric"])),
        ["year", "metric", "unit", "estimated", "value"],
    )

    overall_summary = aggregate(records, ("metric", "unit", "estimated"))
    with (derived_dir / "overall_summary.json").open("w", encoding="utf-8") as handle:
        json.dump(sorted(overall_summary, key=lambda r: r["metric"]), handle, indent=2)

    with (derived_dir / "ingest_report.json").open("w", encoding="utf-8") as handle:
        json.dump(report, handle, indent=2)

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
