#!/usr/bin/env python3
import argparse
import csv
import json
from collections import defaultdict
from datetime import datetime, timezone
from pathlib import Path
from typing import Dict, List, Tuple


def load_records(path: Path) -> List[Dict[str, str]]:
    with path.open("r", encoding="utf-8-sig") as handle:
        return list(csv.DictReader(handle))


def to_float(value: str) -> float:
    try:
        return float(value)
    except (TypeError, ValueError):
        return 0.0


def fmt_number(value: float) -> str:
    if value == 0:
        return "0"
    if abs(value) >= 1_000_000:
        return f"{value:,.0f}"
    if abs(value) >= 1_000:
        return f"{value:,.2f}"
    return f"{value:.4f}".rstrip("0").rstrip(".")


def fmt_small(value: float) -> str:
    if value == 0:
        return "0"
    if abs(value) < 0.0001:
        return f"{value:.2e}"
    return fmt_number(value)


def fmt_currency(value: float) -> str:
    return f"${value:,.2f}"


def aggregate(records: List[Dict[str, str]], keys: Tuple[str, ...]) -> Dict[Tuple[str, ...], float]:
    totals: Dict[Tuple[str, ...], float] = defaultdict(float)
    for record in records:
        key = tuple(record[k] for k in keys)
        totals[key] += to_float(record["value"])
    return totals


def load_pricing_snapshot(path: Path) -> Dict:
    with path.open("r", encoding="utf-8") as handle:
        return json.load(handle)


def extract_plan_prices(pricing: Dict) -> List[Dict[str, object]]:
    plans: List[Dict[str, object]] = []
    for sub in pricing.get("subscriptions", []):
        price = sub.get("price_usd_per_month")
        if price is None:
            continue
        plans.append(
            {
                "scope": "provider",
                "name": f"{sub.get('provider')}::{sub.get('plan_id')}",
                "provider": sub.get("provider"),
                "price": float(price),
                "notes": sub.get("usage_limits") or "",
            }
        )
    for tool in pricing.get("tool_plans", []):
        price = tool.get("subscription_price_usd")
        if price is None:
            price = tool.get("subscription_price_usd_per_seat")
        if price is None:
            continue
        plans.append(
            {
                "scope": "tool",
                "name": f"{tool.get('tool')}::{tool.get('plan_id')}",
                "tool": tool.get("tool"),
                "price": float(price),
                "notes": tool.get("availability_note") or tool.get("notes") or "",
            }
        )
    return plans


def month_in_range(month: str, start_month: str) -> bool:
    if not start_month:
        return True
    return month >= start_month


def build_dashboard(records: List[Dict[str, str]], pricing: Dict, start_month: str) -> str:
    monthly_tokens = aggregate(
        [r for r in records if r["metric"] == "total_tokens"],
        ("month",),
    )
    monthly_cache = aggregate(
        [r for r in records if r["metric"] == "cache_read_tokens"],
        ("month",),
    )
    monthly_cost_actual = aggregate(
        [r for r in records if r["metric"] == "cost_usd"],
        ("month",),
    )
    monthly_cost_estimated = aggregate(
        [r for r in records if r["metric"] == "estimated_api_cost_usd"],
        ("month",),
    )

    month_keys = set()
    month_keys.update([key[0] for key in monthly_tokens.keys()])
    month_keys.update([key[0] for key in monthly_cost_actual.keys()])
    month_keys.update([key[0] for key in monthly_cost_estimated.keys()])
    months = sorted([m for m in month_keys if month_in_range(m, start_month)])

    total_tokens = sum(v for (m,), v in monthly_tokens.items() if month_in_range(m, start_month))
    total_cache = sum(v for (m,), v in monthly_cache.items() if month_in_range(m, start_month))
    total_cost_actual = sum(v for (m,), v in monthly_cost_actual.items() if month_in_range(m, start_month))
    total_cost_estimated = sum(v for (m,), v in monthly_cost_estimated.items() if month_in_range(m, start_month))

    cost_per_token_actual = (total_cost_actual / total_tokens) if total_tokens and total_cost_actual else 0.0
    cost_per_token_estimated = (total_cost_estimated / total_tokens) if total_tokens and total_cost_estimated else 0.0

    provider_cost_actual = aggregate(
        [r for r in records if r["metric"] == "cost_usd"],
        ("month", "provider"),
    )
    provider_cost_estimated = aggregate(
        [r for r in records if r["metric"] == "estimated_api_cost_usd"],
        ("month", "provider"),
    )
    source_cost_actual = aggregate(
        [r for r in records if r["metric"] == "cost_usd"],
        ("month", "source"),
    )
    source_cost_estimated = aggregate(
        [r for r in records if r["metric"] == "estimated_api_cost_usd"],
        ("month", "source"),
    )

    provider_tokens = aggregate(
        [r for r in records if r["metric"] == "total_tokens" and month_in_range(r["month"], start_month)],
        ("provider",),
    )
    provider_cache = aggregate(
        [r for r in records if r["metric"] == "cache_read_tokens" and month_in_range(r["month"], start_month)],
        ("provider",),
    )

    best_effort_cost_by_month_model: Dict[Tuple[str, str, str, str], float] = {}
    for key, value in source_cost_actual.items():
        month, source = key
        if not month_in_range(month, start_month):
            continue
        best_effort_cost_by_month_model[key] = value
    for key, value in source_cost_estimated.items():
        month, source = key
        if not month_in_range(month, start_month):
            continue
        if best_effort_cost_by_month_model.get(key, 0.0) == 0.0:
            best_effort_cost_by_month_model[key] = value

    best_effort_cost_by_provider_month: Dict[Tuple[str, str], float] = defaultdict(float)
    for (month, provider), actual in provider_cost_actual.items():
        if month_in_range(month, start_month):
            best_effort_cost_by_provider_month[(month, provider)] += actual
    for (month, provider), estimated in provider_cost_estimated.items():
        if not month_in_range(month, start_month):
            continue
        if best_effort_cost_by_provider_month.get((month, provider), 0.0) == 0.0:
            best_effort_cost_by_provider_month[(month, provider)] += estimated

    best_effort_cost_by_provider = aggregate(
        [
            {"month": m, "provider": p, "value": v}
            for (m, p), v in best_effort_cost_by_provider_month.items()
        ],
        ("provider",),
    )

    # Model-level cost analysis from records
    cost_actual_by_month_model = aggregate(
        [r for r in records if r["metric"] == "cost_usd"],
        ("month", "provider", "source", "model"),
    )
    cost_est_by_month_model = aggregate(
        [r for r in records if r["metric"] == "estimated_api_cost_usd"],
        ("month", "provider", "source", "model"),
    )

    best_effort_cost_model_month: Dict[Tuple[str, str, str, str], float] = {}
    for key, value in cost_actual_by_month_model.items():
        if month_in_range(key[0], start_month):
            best_effort_cost_model_month[key] = value
    for key, value in cost_est_by_month_model.items():
        if month_in_range(key[0], start_month) and best_effort_cost_model_month.get(key, 0.0) == 0.0:
            best_effort_cost_model_month[key] = value

    model_cost_totals: Dict[Tuple[str, str], float] = defaultdict(float)
    model_months: Dict[Tuple[str, str], set] = defaultdict(set)
    for (month, provider, source, model), cost in best_effort_cost_model_month.items():
        model_cost_totals[(provider, model)] += cost
        model_months[(provider, model)].add(month)

    provider_ranking = sorted(
        [(provider, value) for (provider,), value in best_effort_cost_by_provider.items()],
        key=lambda item: item[1],
        reverse=True,
    )

    non_token_units = aggregate(
        [
            r
            for r in records
            if r["unit"] not in {"tokens", "usd"}
            and r["metric"] not in {"meter_quantity"}
            and month_in_range(r["month"], start_month)
        ],
        ("month", "provider", "source", "model", "metric", "unit"),
    )

    unclassified_units = aggregate(
        [
            r
            for r in records
            if r["metric"] == "meter_quantity" and month_in_range(r["month"], start_month)
        ],
        ("month", "provider", "source", "model", "metric", "unit"),
    )

    cost_by_month_model = aggregate(
        [r for r in records if r["metric"] == "cost_usd" and month_in_range(r["month"], start_month)],
        ("month", "provider", "source", "model"),
    )

    tokens_by_month_model = aggregate(
        [r for r in records if r["metric"] == "total_tokens" and month_in_range(r["month"], start_month)],
        ("month", "provider", "source", "model"),
    )
    cache_by_month_model = aggregate(
        [r for r in records if r["metric"] == "cache_read_tokens" and month_in_range(r["month"], start_month)],
        ("month", "provider", "source", "model"),
    )

    plans = extract_plan_prices(pricing)
    savings_rows = []
    for month in months:
        for plan in plans:
            if plan["scope"] == "provider":
                actual_cost = provider_cost_actual.get((month, plan["provider"]), 0.0)
                estimated_cost = provider_cost_estimated.get((month, plan["provider"]), 0.0)
                basis = "actual" if actual_cost else ("estimated" if estimated_cost else None)
                cost = actual_cost or estimated_cost
            else:
                source_key = (month, (plan.get("tool") or "").lower())
                actual_cost = source_cost_actual.get(source_key, 0.0)
                estimated_cost = source_cost_estimated.get(source_key, 0.0)
                basis = "actual" if actual_cost else ("estimated" if estimated_cost else None)
                cost = actual_cost or estimated_cost

            if not cost:
                continue
            savings = cost - plan["price"]
            if savings > 0:
                savings_rows.append(
                    {
                        "month": month,
                        "plan": plan["name"],
                        "plan_price": plan["price"],
                        "usage_cost": cost,
                        "savings": savings,
                        "basis": basis,
                        "notes": plan.get("notes", ""),
                    }
                )

    savings_rows.sort(key=lambda r: (r["month"], -r["savings"]))

    html = []
    html.append("<!doctype html>")
    html.append("<html><head><meta charset='utf-8'/>")
    html.append("<title>Personal Analysis Dashboard</title>")
    html.append(
        "<style>"
        "body{font-family:system-ui,Segoe UI,Roboto,Helvetica,Arial,sans-serif;margin:24px;color:#111;background:#fff;}"
        "h1,h2{margin:0 0 12px 0;} h2{margin-top:32px;}"
        ".grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:12px;}"
        ".card{border:2px solid #111;padding:12px;}"
        "table{border-collapse:collapse;width:100%;font-size:13px;margin-top:8px;}"
        "th,td{border:1px solid #111;padding:6px 8px;text-align:left;}"
        ".muted{color:#666;font-size:12px;}"
        "</style></head><body>"
    )
    html.append("<h1>Personal Analysis Dashboard</h1>")
    html.append(f"<div class='muted'>Generated {datetime.now(timezone.utc).strftime('%Y-%m-%d %H:%M UTC')}</div>")

    html.append("<div class='grid' style='margin-top:16px;'>")
    html.append(f"<div class='card'><div class='muted'>Total Tokens</div><div>{fmt_number(total_tokens)}</div></div>")
    html.append(f"<div class='card'><div class='muted'>Cache Read Tokens</div><div>{fmt_number(total_cache)}</div></div>")
    html.append(f"<div class='card'><div class='muted'>Actual Cost</div><div>{fmt_currency(total_cost_actual)}</div></div>")
    html.append(f"<div class='card'><div class='muted'>Estimated API Cost</div><div>{fmt_currency(total_cost_estimated)}</div></div>")
    html.append(f"<div class='card'><div class='muted'>Cost / Token (Actual)</div><div>{fmt_small(cost_per_token_actual)}</div><div class='muted'>Per 1M: {fmt_currency(cost_per_token_actual * 1_000_000) if cost_per_token_actual else '$0.00'}</div></div>")
    html.append(f"<div class='card'><div class='muted'>Cost / Token (Estimated)</div><div>{fmt_small(cost_per_token_estimated)}</div><div class='muted'>Per 1M: {fmt_currency(cost_per_token_estimated * 1_000_000) if cost_per_token_estimated else '$0.00'}</div></div>")
    html.append("</div>")

    html.append("<h2>Monthly Overview</h2>")
    html.append("<table><thead><tr><th>Month</th><th>Total Tokens</th><th>Cache Read Tokens</th><th>Actual Cost</th><th>Estimated API Cost</th></tr></thead><tbody>")
    total_overview_tokens = 0.0
    total_overview_cache = 0.0
    total_overview_actual = 0.0
    total_overview_est = 0.0
    for month in months:
        tokens_val = monthly_tokens.get((month,), 0.0)
        cache_val = monthly_cache.get((month,), 0.0)
        actual_val = monthly_cost_actual.get((month,), 0.0)
        est_val = monthly_cost_estimated.get((month,), 0.0)
        total_overview_tokens += tokens_val
        total_overview_cache += cache_val
        total_overview_actual += actual_val
        total_overview_est += est_val
        html.append(
            "<tr>"
            f"<td>{month}</td>"
            f"<td>{fmt_number(tokens_val)}</td>"
            f"<td>{fmt_number(cache_val)}</td>"
            f"<td>{fmt_currency(actual_val)}</td>"
            f"<td>{fmt_currency(est_val)}</td>"
            "</tr>"
        )
    html.append(
        "<tr>"
        "<td><strong>Total</strong></td>"
        f"<td><strong>{fmt_number(total_overview_tokens)}</strong></td>"
        f"<td><strong>{fmt_number(total_overview_cache)}</strong></td>"
        f"<td><strong>{fmt_currency(total_overview_actual)}</strong></td>"
        f"<td><strong>{fmt_currency(total_overview_est)}</strong></td>"
        "</tr>"
    )
    html.append("</tbody></table>")

    html.append("<h2>Monthly Usage by Provider/Model</h2>")
    html.append("<table><thead><tr><th>Month</th><th>Provider</th><th>Source</th><th>Model</th><th>Total Tokens</th><th>Cache Read</th><th>Tokens Ex Cache</th></tr></thead><tbody>")
    total_tokens_all = 0.0
    total_cache_all = 0.0
    total_ex_cache_all = 0.0
    for (month, provider, source, model), tokens in sorted(tokens_by_month_model.items()):
        cache = cache_by_month_model.get((month, provider, source, model), 0.0)
        total_tokens_all += tokens
        total_cache_all += cache
        total_ex_cache_all += (tokens - cache)
        html.append(
            "<tr>"
            f"<td>{month}</td><td>{provider}</td><td>{source}</td><td>{model}</td>"
            f"<td>{fmt_number(tokens)}</td><td>{fmt_number(cache)}</td><td>{fmt_number(tokens - cache)}</td>"
            "</tr>"
        )
    if not tokens_by_month_model:
        html.append("<tr><td colspan='7'>No token usage data found.</td></tr>")
    html.append(
        "<tr>"
        "<td colspan='4'><strong>Total</strong></td>"
        f"<td><strong>{fmt_number(total_tokens_all)}</strong></td>"
        f"<td><strong>{fmt_number(total_cache_all)}</strong></td>"
        f"<td><strong>{fmt_number(total_ex_cache_all)}</strong></td>"
        "</tr>"
    )
    html.append("</tbody></table>")

    html.append("<h2>Monthly Cost by Provider/Model (Actual vs Estimated)</h2>")
    html.append("<table><thead><tr><th>Month</th><th>Provider</th><th>Source</th><th>Model</th><th>Actual Cost</th><th>Estimated Cost</th></tr></thead><tbody>")
    all_cost_keys = set(cost_by_month_model.keys()) | set(cost_est_by_month_model.keys())
    total_actual_cost = 0.0
    total_est_cost = 0.0
    for key in sorted(all_cost_keys):
        month, provider, source, model = key
        actual = cost_by_month_model.get(key, 0.0)
        est = cost_est_by_month_model.get(key, 0.0)
        total_actual_cost += actual
        total_est_cost += est
        html.append(
            "<tr>"
            f"<td>{month}</td><td>{provider}</td><td>{source}</td><td>{model}</td>"
            f"<td>{fmt_currency(actual)}</td><td>{fmt_currency(est)}</td>"
            "</tr>"
        )
    if not all_cost_keys:
        html.append("<tr><td colspan='6'>No cost data found.</td></tr>")
    html.append(
        "<tr>"
        "<td colspan='4'><strong>Total</strong></td>"
        f"<td><strong>{fmt_currency(total_actual_cost)}</strong></td>"
        f"<td><strong>{fmt_currency(total_est_cost)}</strong></td>"
        "</tr>"
    )
    html.append("</tbody></table>")

    html.append("<h2>Coverage Gaps (Tokens with No Cost)</h2>")
    html.append("<div class='muted'>Rows below have tokens recorded but neither actual nor estimated cost.</div>")
    html.append("<table><thead><tr><th>Month</th><th>Provider</th><th>Source</th><th>Model</th><th>Total Tokens</th></tr></thead><tbody>")
    gap_rows = 0
    for (month, provider, source, model), tokens in sorted(tokens_by_month_model.items()):
        if cost_by_month_model.get((month, provider, source, model), 0.0) == 0.0 and cost_est_by_month_model.get((month, provider, source, model), 0.0) == 0.0:
            html.append(
                "<tr>"
                f"<td>{month}</td><td>{provider}</td><td>{source}</td><td>{model}</td><td>{fmt_number(tokens)}</td>"
                "</tr>"
            )
            gap_rows += 1
    if gap_rows == 0:
        html.append("<tr><td colspan='5'>No gaps found.</td></tr>")
    html.append("</tbody></table>")

    html.append("<h2>All‑You‑Can‑Eat Plan Comparison (Savings)</h2>")
    html.append("<div class='muted'>Compares plan price floors against actual or estimated monthly usage cost. Savings shown only when usage cost exceeds plan price. This is a heuristic, not a guarantee of coverage.</div>")
    html.append("<table><thead><tr><th>Month</th><th>Plan</th><th>Plan Price</th><th>Usage Cost</th><th>Savings</th><th>Basis</th></tr></thead><tbody>")
    total_plan_price = 0.0
    total_usage_cost = 0.0
    total_savings = 0.0
    for row in savings_rows:
        total_plan_price += row["plan_price"]
        total_usage_cost += row["usage_cost"]
        total_savings += row["savings"]
        html.append(
            "<tr>"
            f"<td>{row['month']}</td>"
            f"<td>{row['plan']}</td>"
            f"<td>{fmt_currency(row['plan_price'])}</td>"
            f"<td>{fmt_currency(row['usage_cost'])}</td>"
            f"<td>{fmt_currency(row['savings'])}</td>"
            f"<td>{row['basis']}</td>"
            "</tr>"
        )
    if not savings_rows:
        html.append("<tr><td colspan='6'>No savings scenarios available with current cost data.</td></tr>")
    if savings_rows:
        html.append(
            "<tr>"
            "<td colspan='2'><strong>Total</strong></td>"
            f"<td><strong>{fmt_currency(total_plan_price)}</strong></td>"
            f"<td><strong>{fmt_currency(total_usage_cost)}</strong></td>"
            f"<td><strong>{fmt_currency(total_savings)}</strong></td>"
            "<td>—</td>"
            "</tr>"
        )
    html.append("</tbody></table>")

    html.append("<h2>Non‑Token Usage (ACU/Credits/Units)</h2>")
    html.append("<div class='muted'>These are metered units that are not tokens; cost-per-unit shown only when actual cost exists for the same model/month.</div>")
    html.append("<table><thead><tr><th>Month</th><th>Provider</th><th>Source</th><th>Model</th><th>Metric</th><th>Unit</th><th>Value</th><th>Unit per $</th></tr></thead><tbody>")
    non_token_total = 0.0
    for (month, provider, source, model, metric, unit), value in sorted(non_token_units.items()):
        cost = cost_by_month_model.get((month, provider, source, model), 0.0)
        unit_per_usd = (value / cost) if cost else 0.0
        non_token_total += value
        html.append(
            "<tr>"
            f"<td>{month}</td><td>{provider}</td><td>{source}</td><td>{model}</td>"
            f"<td>{metric}</td><td>{unit}</td><td>{fmt_number(value)}</td><td>{fmt_number(unit_per_usd) if cost else '—'}</td>"
            "</tr>"
        )
    if not non_token_units:
        html.append("<tr><td colspan='8'>No non-token units found.</td></tr>")
    html.append(
        "<tr>"
        "<td colspan='6'><strong>Total</strong></td>"
        f"<td><strong>{fmt_number(non_token_total)}</strong></td>"
        "<td>—</td>"
        "</tr>"
    )
    html.append("</tbody></table>")

    if unclassified_units:
        html.append("<h2>Unclassified Units (Meter Quantity)</h2>")
        html.append("<div class='muted'>Raw meter quantities (e.g., Azure Foundry). Units may map to tokens but are not normalized here.</div>")
        html.append("<table><thead><tr><th>Month</th><th>Provider</th><th>Source</th><th>Model</th><th>Value</th></tr></thead><tbody>")
        total_unclassified = 0.0
        for (month, provider, source, model, metric, unit), value in sorted(unclassified_units.items()):
            total_unclassified += value
            html.append(
                "<tr>"
                f"<td>{month}</td><td>{provider}</td><td>{source}</td><td>{model}</td><td>{fmt_number(value)}</td>"
                "</tr>"
            )
        html.append(
            "<tr>"
            "<td colspan='4'><strong>Total</strong></td>"
            f"<td><strong>{fmt_number(total_unclassified)}</strong></td>"
            "</tr>"
        )
        html.append("</tbody></table>")

    html.append("<h2>Data Files</h2>")
    html.append("<div class='muted'>All files below are private and gitignored.</div>")
    html.append(
        "<ul>"
        "<li>data/private/derived/personal-analysis/records.csv</li>"
        "<li>data/private/derived/personal-analysis/monthly_by_model.csv</li>"
        "<li>data/private/derived/personal-analysis/monthly_by_provider.csv</li>"
        "<li>data/private/derived/personal-analysis/yearly_summary.csv</li>"
        "<li>data/private/derived/personal-analysis/overall_summary.json</li>"
        "</ul>"
    )

    html.append("</body></html>")
    return "\n".join(html)


def main() -> int:
    parser = argparse.ArgumentParser(description="Generate personal analysis HTML dashboard.")
    parser.add_argument("--derived-dir", default="data/private/derived/personal-analysis", help="Derived data directory")
    parser.add_argument("--pricing", default="apps/public-calculator/data/pricing.2026-02-22.json", help="Pricing snapshot JSON")
    parser.add_argument("--output", default="data/private/derived/personal-analysis/dashboard.html", help="Output HTML path")
    parser.add_argument("--start-month", default="", help="Earliest month to include (YYYY-MM). Empty = all data.")
    args = parser.parse_args()

    derived_dir = Path(args.derived_dir)
    records_path = derived_dir / "records.csv"
    if not records_path.exists():
        raise SystemExit(f"Missing records.csv at {records_path}. Run run_personal_analysis.py first.")

    records = load_records(records_path)
    pricing = load_pricing_snapshot(Path(args.pricing))
    html = build_dashboard(records, pricing, args.start_month)

    output_path = Path(args.output)
    output_path.parent.mkdir(parents=True, exist_ok=True)
    output_path.write_text(html, encoding="utf-8")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
    html.append("<h2>Tokens by Provider</h2>")
    html.append("<table><thead><tr><th>Provider</th><th>Total Tokens</th><th>Cache Read Tokens</th><th>Tokens Excluding Cache</th><th>Best‑Effort Cost</th><th>Cost / 1M Tokens</th></tr></thead><tbody>")
    total_provider_tokens = 0.0
    total_provider_cache = 0.0
    total_provider_cost = 0.0
    for (provider,), tokens in sorted(provider_tokens.items(), key=lambda item: item[1], reverse=True):
        cache = provider_cache.get((provider,), 0.0)
        tokens_ex_cache = tokens - cache
        cost = best_effort_cost_by_provider.get((provider,), 0.0)
        cost_per_m = (cost / tokens) * 1_000_000 if tokens else 0.0
        total_provider_tokens += tokens
        total_provider_cache += cache
        total_provider_cost += cost
        html.append(
            "<tr>"
            f"<td>{provider}</td>"
            f"<td>{fmt_number(tokens)}</td>"
            f"<td>{fmt_number(cache)}</td>"
            f"<td>{fmt_number(tokens_ex_cache)}</td>"
            f"<td>{fmt_currency(cost)}</td>"
            f"<td>{fmt_currency(cost_per_m) if cost_per_m else '—'}</td>"
            "</tr>"
        )
    total_cost_per_m = (total_provider_cost / total_provider_tokens) * 1_000_000 if total_provider_tokens else 0.0
    html.append(
        "<tr>"
        "<td><strong>Total</strong></td>"
        f"<td><strong>{fmt_number(total_provider_tokens)}</strong></td>"
        f"<td><strong>{fmt_number(total_provider_cache)}</strong></td>"
        f"<td><strong>{fmt_number(total_provider_tokens - total_provider_cache)}</strong></td>"
        f"<td><strong>{fmt_currency(total_provider_cost)}</strong></td>"
        f"<td><strong>{fmt_currency(total_cost_per_m) if total_cost_per_m else '—'}</strong></td>"
        "</tr>"
    )
    html.append("</tbody></table>")

    html.append("<h2>Cost by Provider (Best‑Effort)</h2>")
    html.append("<table><thead><tr><th>Provider</th><th>Total Cost</th><th>Rank</th></tr></thead><tbody>")
    total_rank_cost = 0.0
    for index, (provider, value) in enumerate(provider_ranking, start=1):
        total_rank_cost += value
        html.append(
            "<tr>"
            f"<td>{provider}</td><td>{fmt_currency(value)}</td><td>{index}</td>"
            "</tr>"
        )
    if not provider_ranking:
        html.append("<tr><td colspan='3'>No provider cost data available.</td></tr>")
    html.append(
        "<tr>"
        "<td><strong>Total</strong></td>"
        f"<td><strong>{fmt_currency(total_rank_cost)}</strong></td>"
        "<td>—</td>"
        "</tr>"
    )
    html.append("</tbody></table>")

    html.append("<h2>Cost by Model (Best‑Effort, Avg/Month)</h2>")
    html.append("<div class='muted'>Average uses months with usage since start month filter.</div>")
    html.append("<table><thead><tr><th>Provider</th><th>Model</th><th>Total Cost</th><th>Months</th><th>Avg / Month</th></tr></thead><tbody>")
    total_model_cost = 0.0
    for (provider, model), total_cost in sorted(model_cost_totals.items(), key=lambda item: item[1], reverse=True):
        months_count = len(model_months[(provider, model)])
        avg_cost = total_cost / months_count if months_count else 0.0
        total_model_cost += total_cost
        html.append(
            "<tr>"
            f"<td>{provider}</td><td>{model}</td><td>{fmt_currency(total_cost)}</td>"
            f"<td>{months_count}</td><td>{fmt_currency(avg_cost)}</td>"
            "</tr>"
        )
    if not model_cost_totals:
        html.append("<tr><td colspan='5'>No model cost data available.</td></tr>")
    html.append(
        "<tr>"
        "<td colspan='2'><strong>Total</strong></td>"
        f"<td><strong>{fmt_currency(total_model_cost)}</strong></td>"
        "<td>—</td><td>—</td>"
        "</tr>"
    )
    html.append("</tbody></table>")
