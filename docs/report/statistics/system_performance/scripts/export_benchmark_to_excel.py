#!/usr/bin/env python3
"""Export system performance benchmarks to Excel + PNG figures.

Reads docs/report/statistics/system_performance/benchmark_output and writes:
  - exports/system_performance_results.xlsx
  - exports/figures/*.png
  - exports/FIGURE_INDEX.md

Numbers are the canonical published snapshot from Chapter 4/5 evaluation tables
(k6 HTTP load, Go micro-benchmark, resource monitor summary).
"""

from __future__ import annotations

import json
from pathlib import Path
from typing import Any

import matplotlib

matplotlib.use("Agg")
import matplotlib.pyplot as plt
import pandas as pd
from openpyxl.styles import Alignment, Font, PatternFill
from openpyxl.utils import get_column_letter

ROOT = Path(__file__).resolve().parents[1]
INPUT = ROOT / "benchmark_output"
EXPORT = ROOT / "exports"
FIGURES = EXPORT / "figures"

PALETTE = {
    "navy": "#1B3A4B",
    "teal": "#0D7377",
    "coral": "#C44536",
    "amber": "#E09F3E",
    "slate": "#4A5568",
    "mint": "#2A9D8F",
    "sand": "#F4A261",
    "ink": "#264653",
    "crud": "#1B3A4B",
    "matching": "#0D7377",
    "coi": "#E09F3E",
}


def read_json(path: Path) -> Any:
    with path.open(encoding="utf-8") as f:
        return json.load(f)


def style_header(ws) -> None:
    fill = PatternFill("solid", fgColor="1B3A4B")
    font = Font(color="FFFFFF", bold=True)
    for cell in ws[1]:
        cell.fill = fill
        cell.font = font
        cell.alignment = Alignment(vertical="center", wrap_text=True)


def autosize(ws, max_width: int = 48) -> None:
    for col in ws.columns:
        letter = get_column_letter(col[0].column)
        width = 10
        for cell in col[:80]:
            if cell.value is None:
                continue
            width = max(width, min(max_width, len(str(cell.value)) + 2))
        ws.column_dimensions[letter].width = width


def write_df(writer: pd.ExcelWriter, df: pd.DataFrame, sheet: str) -> None:
    out = df.copy()
    if out.empty:
        out = pd.DataFrame({"note": ["(empty)"]})
    out.to_excel(writer, sheet_name=sheet, index=False)
    ws = writer.book[sheet]
    style_header(ws)
    autosize(ws)
    ws.freeze_panes = "A2"
    ws.auto_filter.ref = ws.dimensions


def apply_style() -> None:
    plt.rcParams.update(
        {
            "font.family": "DejaVu Sans",
            "axes.titlesize": 12,
            "axes.labelsize": 10,
            "xtick.labelsize": 9,
            "ytick.labelsize": 9,
            "figure.facecolor": "white",
            "axes.facecolor": "white",
            "axes.edgecolor": PALETTE["slate"],
            "axes.grid": True,
            "grid.alpha": 0.25,
            "grid.linestyle": "--",
        }
    )


def scenario_color(name: str) -> str:
    return {
        "CRUD": PALETTE["crud"],
        "Matching": PALETTE["matching"],
        "COI": PALETTE["coi"],
    }.get(name, PALETTE["slate"])


def load_k6() -> tuple[pd.DataFrame, dict]:
    data = read_json(INPUT / "k6_http_results.json")
    df = pd.DataFrame(data["scenarios"])
    return df, data


def load_micro() -> pd.DataFrame:
    data = read_json(INPUT / "microbench_results.json")
    rows = []
    for algo in data["algorithms"]:
        for size in algo["sizes"]:
            rows.append(
                {
                    "algorithm": algo["algorithm"],
                    "algorithm_vi": algo["algorithm_vi"],
                    "size": size["size"],
                    "size_vi": size["size_vi"],
                    "us_per_op": size["us_per_op"],
                    "ms_per_op": size["ms_per_op"],
                    "alloc_kb": size.get("alloc_kb"),
                    "alloc_mb": size.get("alloc_mb"),
                    "allocs": size["allocs"],
                }
            )
    return pd.DataFrame(rows)


def load_resources() -> pd.DataFrame:
    data = read_json(INPUT / "resource_usage.json")
    return pd.DataFrame(data["components"])


def build_overview(k6: pd.DataFrame, k6_meta: dict, micro: pd.DataFrame, resources: pd.DataFrame) -> pd.DataFrame:
    rows = [
        {
            "area": "seed",
            "metric": "conferences / submissions / reviewers",
            "value": f"{k6_meta['seed']['conferences']} / {k6_meta['seed']['submissions']} / {k6_meta['seed']['reviewer_conference_relations']}",
            "note": "0 seed errors",
        },
        {
            "area": "http",
            "metric": "total_requests",
            "value": int(k6["requests"].sum()),
            "note": "CRUD + Matching + COI",
        },
        {
            "area": "http",
            "metric": "max_p95_ms",
            "value": float(k6["p95_ms"].max()),
            "note": "Target: p95 < 120 ms",
        },
        {
            "area": "http",
            "metric": "error_rate_pct",
            "value": 0.0,
            "note": "All scenarios",
        },
        {
            "area": "http",
            "metric": "crud_avg_ms",
            "value": float(k6[k6["scenario"] == "CRUD"]["avg_ms"].iloc[0]),
            "note": "Highest avg latency (PostgreSQL-bound)",
        },
        {
            "area": "http",
            "metric": "matching_throughput_rps",
            "value": float(k6[k6["scenario"] == "Matching"]["throughput_rps"].iloc[0]),
            "note": "Highest throughput",
        },
        {
            "area": "micro",
            "metric": "coi_large_us",
            "value": float(micro[(micro["algorithm"] == "coi_detection") & (micro["size"] == "large")]["us_per_op"].iloc[0]),
            "note": "µs/op at large scale",
        },
        {
            "area": "micro",
            "metric": "matching_large_ms",
            "value": float(micro[(micro["algorithm"] == "reviewer_matching") & (micro["size"] == "large")]["ms_per_op"].iloc[0]),
            "note": "ms/op at large scale",
        },
        {
            "area": "resources",
            "metric": "bottleneck",
            "value": "PostgreSQL",
            "note": f"CPU avg {int(resources[resources['component']=='postgresql']['cpu_avg_pct'].iloc[0])}%",
        },
    ]
    return pd.DataFrame(rows)


def chart_throughput(k6: pd.DataFrame) -> Path:
    labels = [f"{r.scenario_vi}\n({r.scenario})" for r in k6.itertuples()]
    vals = list(k6["throughput_rps"])
    colors = [scenario_color(s) for s in k6["scenario"]]
    fig, ax = plt.subplots(figsize=(8, 4.8))
    bars = ax.bar(labels, vals, color=colors)
    for bar, v, n in zip(bars, vals, k6["requests"]):
        ax.text(
            bar.get_x() + bar.get_width() / 2,
            bar.get_height() + 8,
            f"{v:g} req/s\n({int(n):,} req)",
            ha="center",
            fontsize=8,
            color=PALETTE["ink"],
        )
    ax.set_ylabel("Throughput (req/s)")
    ax.set_title("Thông lượng HTTP theo kịch bản k6 (20 VU × 30s)")
    ax.set_ylim(0, max(vals) * 1.25)
    fig.tight_layout()
    path = FIGURES / "fig01_k6_throughput.png"
    fig.savefig(path, dpi=160)
    plt.close(fig)
    return path


def chart_latency(k6: pd.DataFrame) -> Path:
    metrics = ["median_ms", "p90_ms", "p95_ms", "avg_ms"]
    metric_labels = ["Median", "p90", "p95", "Avg"]
    scenarios = list(k6["scenario"])
    x = range(len(metric_labels))
    width = 0.25
    fig, ax = plt.subplots(figsize=(9.5, 5))
    for i, sc in enumerate(scenarios):
        row = k6[k6["scenario"] == sc].iloc[0]
        vals = [float(row[m]) for m in metrics]
        offset = (i - 1) * width
        bars = ax.bar(
            [xi + offset for xi in x],
            vals,
            width,
            label=sc,
            color=scenario_color(sc),
        )
        for bar, v in zip(bars, vals):
            ax.text(
                bar.get_x() + bar.get_width() / 2,
                bar.get_height() + 1.5,
                f"{v:g}",
                ha="center",
                fontsize=7,
                rotation=0,
            )
    ax.axhline(120, color=PALETTE["coral"], linestyle="--", linewidth=1.2, label="p95 target 120 ms")
    ax.set_xticks(list(x))
    ax.set_xticklabels(metric_labels)
    ax.set_ylabel("Độ trễ (ms)")
    ax.set_title("Độ trễ HTTP theo phân vị — k6")
    ax.legend(frameon=False, ncol=4, fontsize=8)
    fig.tight_layout()
    path = FIGURES / "fig02_k6_latency.png"
    fig.savefig(path, dpi=160)
    plt.close(fig)
    return path


def chart_requests_and_errors(k6: pd.DataFrame) -> Path:
    fig, axes = plt.subplots(1, 2, figsize=(10, 4.5))
    colors = [scenario_color(s) for s in k6["scenario"]]
    axes[0].bar(k6["scenario"], k6["requests"], color=colors)
    axes[0].set_title("Số request theo kịch bản")
    axes[0].set_ylabel("Requests")
    for i, (sc, n) in enumerate(zip(k6["scenario"], k6["requests"])):
        axes[0].text(i, n + 200, f"{int(n):,}", ha="center", fontsize=8)

    axes[1].bar(k6["scenario"], k6["error_rate_pct"], color=colors)
    axes[1].set_ylim(0, 1)
    axes[1].set_title("Tỷ lệ lỗi request (%)")
    axes[1].set_ylabel("%")
    for i, v in enumerate(k6["error_rate_pct"]):
        axes[1].text(i, 0.05, f"{v:g}%", ha="center", fontsize=10, fontweight="bold")
    fig.suptitle("Quy mô tải và độ tin cậy vận hành")
    fig.tight_layout()
    path = FIGURES / "fig03_k6_volume_errors.png"
    fig.savefig(path, dpi=160)
    plt.close(fig)
    return path


def chart_microbench_scale(micro: pd.DataFrame) -> Path:
    size_order = {"small": 0, "medium": 1, "large": 2}
    fig, axes = plt.subplots(1, 2, figsize=(10.5, 4.8))

    for ax, algo, color, title, unit_col, unit_label in [
        (
            axes[0],
            "coi_detection",
            PALETTE["amber"],
            "Phát hiện COI",
            "us_per_op",
            "µs/op",
        ),
        (
            axes[1],
            "reviewer_matching",
            PALETTE["teal"],
            "Đối sánh phản biện",
            "ms_per_op",
            "ms/op",
        ),
    ]:
        sub = micro[micro["algorithm"] == algo].copy()
        sub["_ord"] = sub["size"].map(size_order)
        sub = sub.sort_values("_ord")
        labels = list(sub["size_vi"])
        vals = list(sub[unit_col])
        bars = ax.bar(labels, vals, color=color)
        for bar, v in zip(bars, vals):
            ax.text(
                bar.get_x() + bar.get_width() / 2,
                bar.get_height() * 1.03,
                f"{v:g}",
                ha="center",
                fontsize=9,
                fontweight="bold",
            )
        ax.set_title(title)
        ax.set_ylabel(unit_label)
        ax.set_yscale("log")

    fig.suptitle("Go micro-benchmark theo quy mô dữ liệu (log scale)")
    fig.tight_layout()
    path = FIGURES / "fig04_microbench_scale.png"
    fig.savefig(path, dpi=160)
    plt.close(fig)
    return path


def chart_microbench_allocs(micro: pd.DataFrame) -> Path:
    size_order = {"small": 0, "medium": 1, "large": 2}
    fig, ax = plt.subplots(figsize=(8.5, 4.8))
    width = 0.35
    sizes = ["small", "medium", "large"]
    size_vi = ["Nhỏ", "Trung bình", "Lớn"]
    x = range(len(sizes))
    for i, (algo, color, label) in enumerate(
        [
            ("coi_detection", PALETTE["amber"], "COI"),
            ("reviewer_matching", PALETTE["teal"], "Matching"),
        ]
    ):
        vals = []
        for s in sizes:
            row = micro[(micro["algorithm"] == algo) & (micro["size"] == s)].iloc[0]
            vals.append(int(row["allocs"]))
        bars = ax.bar([xi + (i - 0.5) * width for xi in x], vals, width, label=label, color=color)
        for bar, v in zip(bars, vals):
            ax.text(bar.get_x() + bar.get_width() / 2, bar.get_height() * 1.05, f"{v:,}", ha="center", fontsize=7)
    ax.set_xticks(list(x))
    ax.set_xticklabels(size_vi)
    ax.set_ylabel("Số allocations / op")
    ax.set_yscale("log")
    ax.set_title("Chi phí cấp phát bộ nhớ (allocations)")
    ax.legend(frameon=False)
    fig.tight_layout()
    path = FIGURES / "fig05_microbench_allocs.png"
    fig.savefig(path, dpi=160)
    plt.close(fig)
    return path


def chart_resources(resources: pd.DataFrame) -> Path:
    labels = list(resources["component_vi"])
    fig, axes = plt.subplots(1, 2, figsize=(10.5, 4.8))

    x = range(len(labels))
    width = 0.36
    axes[0].bar([i - width / 2 for i in x], resources["cpu_avg_pct"], width, label="CPU avg %", color=PALETTE["teal"])
    axes[0].bar([i + width / 2 for i in x], resources["cpu_peak_pct"], width, label="CPU peak %", color=PALETTE["coral"])
    axes[0].set_xticks(list(x))
    axes[0].set_xticklabels(labels, rotation=15, ha="right")
    axes[0].set_ylabel("CPU % (per-core)")
    axes[0].set_title("CPU theo thành phần")
    axes[0].legend(frameon=False, fontsize=8)

    axes[1].bar([i - width / 2 for i in x], resources["ram_avg_mb"], width, label="RAM avg MB", color=PALETTE["navy"])
    axes[1].bar([i + width / 2 for i in x], resources["ram_peak_mb"], width, label="RAM peak MB", color=PALETTE["amber"])
    axes[1].set_xticks(list(x))
    axes[1].set_xticklabels(labels, rotation=15, ha="right")
    axes[1].set_ylabel("RAM (MB)")
    axes[1].set_title("Bộ nhớ theo thành phần")
    axes[1].legend(frameon=False, fontsize=8)

    fig.suptitle("Tài nguyên tiêu thụ trong lúc chạy tải k6")
    fig.tight_layout()
    path = FIGURES / "fig06_resource_usage.png"
    fig.savefig(path, dpi=160)
    plt.close(fig)
    return path


def chart_headline(k6: pd.DataFrame, micro: pd.DataFrame) -> Path:
    crud = k6[k6["scenario"] == "CRUD"].iloc[0]
    matching = k6[k6["scenario"] == "Matching"].iloc[0]
    coi_large = micro[(micro["algorithm"] == "coi_detection") & (micro["size"] == "large")].iloc[0]
    match_large = micro[(micro["algorithm"] == "reviewer_matching") & (micro["size"] == "large")].iloc[0]
    items = [
        ("Throughput\nMatching", matching["throughput_rps"], "req/s"),
        ("Throughput\nCRUD", crud["throughput_rps"], "req/s"),
        ("p95 max\n(CRUD)", crud["p95_ms"], "ms"),
        ("Error rate", 0.0, "%"),
        ("COI large", coi_large["us_per_op"], "µs"),
        ("Match large", match_large["ms_per_op"], "ms"),
    ]
    fig, ax = plt.subplots(figsize=(10.5, 4.2))
    colors = [PALETTE["matching"], PALETTE["crud"], PALETTE["coral"], PALETTE["mint"], PALETTE["amber"], PALETTE["teal"]]
    bars = ax.bar([i[0] for i in items], [float(i[1]) for i in items], color=colors)
    max_val = max(float(i[1]) for i in items)
    for bar, (_, val, unit) in zip(bars, items):
        ax.text(
            bar.get_x() + bar.get_width() / 2,
            bar.get_height() + max_val * 0.02,
            f"{val:g} {unit}",
            ha="center",
            fontsize=8,
            fontweight="bold",
        )
    ax.set_title("Headline — hiệu năng hệ thống (k6 + micro-benchmark)")
    ax.set_ylabel("Giá trị (đơn vị ghi trên cột)")
    ax.set_ylim(0, max(float(i[1]) for i in items) * 1.25)
    fig.tight_layout()
    path = FIGURES / "fig07_headline_metrics.png"
    fig.savefig(path, dpi=160)
    plt.close(fig)
    return path


def write_figure_index(paths: list[tuple[str, str, str]]) -> None:
    lines = [
        "# Figure index — system performance",
        "",
        "Sinh tự động từ `scripts/export_benchmark_to_excel.py`.",
        "Dùng PNG trong `exports/figures/` cho Chương 4 (hiệu năng backend).",
        "",
        "| File | Nội dung | Gợi ý chỗ dùng |",
        "| --- | --- | --- |",
    ]
    for fname, content, placement in paths:
        lines.append(f"| `{fname}` | {content} | {placement} |")
    lines.extend(
        [
            "",
            "## Excel workbook",
            "",
            "- `system_performance_results.xlsx`",
            "  - `Overview` — headline",
            "  - `K6_HTTP` — CRUD / Matching / COI",
            "  - `K6_Environment` — seed + host config",
            "  - `Microbench` — COI + matching theo scale",
            "  - `Resources` — CPU/RAM theo component",
            "  - `Headline` — chỉ số tóm tắt",
            "",
            "## Caveats (bắt buộc khi trích vào báo cáo)",
            "",
            "1. k6: 20 VU × 30s mỗi kịch bản — tải ngắn hạn, không thay stress test dài hạn.",
            "2. p95 < 120 ms và 0% lỗi chỉ khẳng định trên cấu hình thử nghiệm (14 CPU / 48 GB RAM).",
            "3. Micro-benchmark đo chi phí thuật toán thuần (không HTTP/DB); không so trực tiếp với độ trễ k6.",
            "4. CPU% là per-core; PostgreSQL avg ~115% nghĩa là hơn 1 nhân, không phải 115% toàn máy.",
            "5. Số liệu là snapshot đã công bố trong báo cáo; raw k6 JSON run directory không còn trong repo.",
            "",
        ]
    )
    (EXPORT / "FIGURE_INDEX.md").write_text("\n".join(lines), encoding="utf-8")


def main() -> None:
    EXPORT.mkdir(parents=True, exist_ok=True)
    FIGURES.mkdir(parents=True, exist_ok=True)
    apply_style()

    k6, k6_meta = load_k6()
    micro = load_micro()
    resources = load_resources()
    headline = read_json(INPUT / "headline_metrics.json")
    overview = build_overview(k6, k6_meta, micro, resources)

    env_rows = []
    for section in ("environment", "seed", "headline"):
        for k, v in k6_meta[section].items():
            env_rows.append(
                {
                    "section": section,
                    "field": k,
                    "value": json.dumps(v) if isinstance(v, (list, dict)) else v,
                }
            )
    env_df = pd.DataFrame(env_rows)

    headline_rows = []
    for group, payload in headline.items():
        for k, v in payload.items():
            headline_rows.append({"group": group, "metric": k, "value": v})
    headline_df = pd.DataFrame(headline_rows)

    xlsx_path = EXPORT / "system_performance_results.xlsx"
    with pd.ExcelWriter(xlsx_path, engine="openpyxl") as writer:
        write_df(writer, overview, "Overview")
        write_df(writer, k6, "K6_HTTP")
        write_df(writer, env_df, "K6_Environment")
        write_df(writer, micro, "Microbench")
        write_df(writer, resources, "Resources")
        write_df(writer, headline_df, "Headline")

    fig_meta: list[tuple[str, str, str]] = []
    p = chart_throughput(k6)
    fig_meta.append((p.name, "Throughput req/s theo kịch bản k6", "Chương 4 — tải HTTP"))
    p = chart_latency(k6)
    fig_meta.append((p.name, "Median / p90 / p95 / avg latency", "Chương 4 — độ trễ"))
    p = chart_requests_and_errors(k6)
    fig_meta.append((p.name, "Số request + error rate 0%", "Chương 4 — độ tin cậy"))
    p = chart_microbench_scale(micro)
    fig_meta.append((p.name, "COI vs matching theo scale (log)", "Chương 4 — micro-benchmark"))
    p = chart_microbench_allocs(micro)
    fig_meta.append((p.name, "Allocations theo scale", "Chương 4 — chi phí bộ nhớ thuật toán"))
    p = chart_resources(resources)
    fig_meta.append((p.name, "CPU/RAM API / Postgres / Neo4j / Redis", "Chương 4 — tài nguyên"))
    p = chart_headline(k6, micro)
    fig_meta.append((p.name, "Headline metrics hiệu năng", "Chương 4/5 — tóm tắt"))

    write_figure_index(fig_meta)
    print("Wrote:", xlsx_path)
    print("Figures:", FIGURES)
    print("Charts:", len(fig_meta))


if __name__ == "__main__":
    main()
