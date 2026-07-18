#!/usr/bin/env python3
"""Export deterministic matching-quality benchmarks to Excel + PNG figures.

Reads docs/report/statistics/deterministic_workflow/benchmark_output and writes:
  - exports/deterministic_benchmark_results.xlsx
  - exports/figures/*.png
  - exports/FIGURE_INDEX.md
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
    "prod": "#0D7377",
    "baseline": "#4A5568",
    "random": "#C44536",
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


def load_quality_long() -> pd.DataFrame:
    return pd.read_csv(INPUT / "quality-results.csv")


def load_ranking_wide(long_df: pd.DataFrame) -> pd.DataFrame:
    rank = long_df[long_df["section"] == "ranking"].copy()
    wide = rank.pivot(index="method", columns="metric", values="value").reset_index()
    wide.columns.name = None
    order = {"jaccard": 0, "overlap_count": 1, "random": 2}
    wide["_ord"] = wide["method"].map(order)
    wide = wide.sort_values("_ord").drop(columns="_ord")
    wide["role"] = wide["method"].map(
        {"jaccard": "production", "overlap_count": "baseline", "random": "baseline"}
    )
    return wide


def load_assignment_wide(long_df: pd.DataFrame) -> pd.DataFrame:
    assign = long_df[long_df["section"] == "assignment"].copy()
    wide = assign.pivot(index="method", columns="metric", values="value").reset_index()
    wide.columns.name = None
    order = {"greedy": 0, "round_robin": 1, "random": 2}
    wide["_ord"] = wide["method"].map(order)
    wide = wide.sort_values("_ord").drop(columns="_ord")
    wide["role"] = wide["method"].map(
        {"greedy": "production", "round_robin": "baseline", "random": "baseline"}
    )
    return wide


def load_synthetic_compare() -> pd.DataFrame:
    data = read_json(INPUT / "synthetic_vs_real.json")
    rows = []
    for metric in [
        "jaccard_mrr",
        "jaccard_hit_at_5",
        "jaccard_hit_at_10",
        "greedy_mean_score",
        "greedy_coverage",
    ]:
        rows.append(
            {
                "metric": metric,
                "synthetic": data["synthetic"][metric],
                "real": data["real"][metric],
                "relative_change_pct": data["relative_change_pct"][metric],
            }
        )
    return pd.DataFrame(rows)


def build_overview(
    ranking: pd.DataFrame, assignment: pd.DataFrame, fixture: dict, headline: dict
) -> pd.DataFrame:
    j = ranking[ranking["method"] == "jaccard"].iloc[0]
    g = assignment[assignment["method"] == "greedy"].iloc[0]
    r = ranking[ranking["method"] == "random"].iloc[0]
    rows = [
        {
            "area": "fixture",
            "metric": "authors / papers / LOO queries",
            "value": f"{fixture['authors']} / {fixture['papers']} / {fixture['loo_queries']}",
            "note": "Real Semantic Scholar data",
        },
        {
            "area": "ranking",
            "metric": "jaccard_mrr",
            "value": round(float(j["mrr"]), 3),
            "note": f"{headline['reviewer_ranking']['mrr_vs_random_multiplier']}× vs random",
        },
        {
            "area": "ranking",
            "metric": "jaccard_hit_at_5",
            "value": round(float(j["hit_at_5"]), 3),
            "note": f"{headline['reviewer_ranking']['hit_at_5_vs_random_multiplier']}× vs random",
        },
        {
            "area": "ranking",
            "metric": "random_mrr",
            "value": round(float(r["mrr"]), 3),
            "note": "Matches theoretical H(N)/N ≈ 0.078",
        },
        {
            "area": "assignment",
            "metric": "greedy_mean_score",
            "value": round(float(g["mean_score"]), 6),
            "note": f"{headline['assignment']['mean_score_vs_baseline_multiplier']}× vs baselines",
        },
        {
            "area": "assignment",
            "metric": "greedy_coverage",
            "value": round(float(g["coverage"]), 3),
            "note": "Quality-first design; chairs handle remainder",
        },
        {
            "area": "assignment",
            "metric": "coi_violations",
            "value": int(g["coi_violations"]),
            "note": "Must be 0 for ethical compliance",
        },
        {
            "area": "assignment",
            "metric": "fallback_rate",
            "value": round(float(g["fallback_rate"]), 3),
            "note": "When no positive-similarity reviewer remains",
        },
    ]
    return pd.DataFrame(rows)


def chart_ranking_metrics(ranking: pd.DataFrame) -> Path:
    metrics = ["hit_at_1", "hit_at_5", "hit_at_10", "mrr", "ndcg_at_10"]
    labels = ["Hit@1", "Hit@5", "Hit@10", "MRR", "nDCG@10"]
    methods = list(ranking["method"])
    colors = {
        "jaccard": PALETTE["prod"],
        "overlap_count": PALETTE["amber"],
        "random": PALETTE["random"],
    }
    x = range(len(metrics))
    width = 0.25
    fig, ax = plt.subplots(figsize=(9.5, 5.2))
    for i, method in enumerate(methods):
        row = ranking[ranking["method"] == method].iloc[0]
        vals = [float(row[m]) for m in metrics]
        offset = (i - 1) * width
        bars = ax.bar(
            [xi + offset for xi in x],
            vals,
            width,
            label=method,
            color=colors.get(method, PALETTE["slate"]),
            edgecolor="white",
            linewidth=0.5,
        )
        for bar, v in zip(bars, vals):
            ax.text(
                bar.get_x() + bar.get_width() / 2,
                bar.get_height() + 0.015,
                f"{v:.2f}",
                ha="center",
                va="bottom",
                fontsize=7.5,
                color=PALETTE["ink"],
            )
    ax.set_xticks(list(x))
    ax.set_xticklabels(labels)
    ax.set_ylim(0, 1.05)
    ax.set_ylabel("Giá trị chỉ số")
    ax.set_title("Chất lượng xếp hạng gợi ý phản biện (Ranking)")
    ax.legend(frameon=False, loc="upper right")
    fig.tight_layout()
    path = FIGURES / "fig01_ranking_metrics.png"
    fig.savefig(path, dpi=160)
    plt.close(fig)
    return path


def chart_ranking_vs_random(ranking: pd.DataFrame) -> Path:
    j = ranking[ranking["method"] == "jaccard"].iloc[0]
    r = ranking[ranking["method"] == "random"].iloc[0]
    metrics = ["hit_at_1", "hit_at_5", "hit_at_10", "mrr"]
    labels = ["Hit@1", "Hit@5", "Hit@10", "MRR"]
    j_vals = [float(j[m]) for m in metrics]
    r_vals = [float(r[m]) for m in metrics]
    mult = [jv / rv if rv > 0 else 0 for jv, rv in zip(j_vals, r_vals)]

    fig, axes = plt.subplots(1, 2, figsize=(10.5, 4.8))
    x = range(len(labels))
    axes[0].bar([i - 0.18 for i in x], j_vals, 0.36, label="Jaccard (production)", color=PALETTE["prod"])
    axes[0].bar([i + 0.18 for i in x], r_vals, 0.36, label="Random", color=PALETTE["random"])
    axes[0].set_xticks(list(x))
    axes[0].set_xticklabels(labels)
    axes[0].set_ylim(0, 1.0)
    axes[0].set_title("Jaccard vs Random")
    axes[0].legend(frameon=False, fontsize=8)
    axes[0].set_ylabel("Giá trị chỉ số")

    bars = axes[1].bar(labels, mult, color=PALETTE["teal"])
    for bar, v in zip(bars, mult):
        axes[1].text(
            bar.get_x() + bar.get_width() / 2,
            bar.get_height() + 0.15,
            f"{v:.1f}×",
            ha="center",
            fontsize=9,
            fontweight="bold",
            color=PALETTE["ink"],
        )
    axes[1].axhline(1.0, color=PALETTE["slate"], linestyle="--", linewidth=1)
    axes[1].set_title("Hệ số cải thiện so với random")
    axes[1].set_ylabel("Jaccard / Random")
    fig.suptitle("Giá trị của thuật toán xếp hạng so với baseline ngẫu nhiên", y=1.02)
    fig.tight_layout()
    path = FIGURES / "fig02_ranking_vs_random.png"
    fig.savefig(path, dpi=160, bbox_inches="tight")
    plt.close(fig)
    return path


def chart_assignment(assignment: pd.DataFrame) -> Path:
    methods = list(assignment["method"])
    labels = {"greedy": "Greedy\n(production)", "round_robin": "Round-robin", "random": "Random"}
    colors = [PALETTE["prod"] if m == "greedy" else PALETTE["slate"] for m in methods]
    coverage = [float(assignment[assignment["method"] == m]["coverage"].iloc[0]) for m in methods]
    mean_score = [float(assignment[assignment["method"] == m]["mean_score"].iloc[0]) for m in methods]
    coi = [int(assignment[assignment["method"] == m]["coi_violations"].iloc[0]) for m in methods]
    fallback = [float(assignment[assignment["method"] == m]["fallback_rate"].iloc[0]) for m in methods]

    fig, axes = plt.subplots(2, 2, figsize=(10, 7))
    xt = [labels[m] for m in methods]

    axes[0, 0].bar(xt, coverage, color=colors)
    axes[0, 0].set_ylim(0, 1.15)
    axes[0, 0].set_title("Coverage")
    for i, v in enumerate(coverage):
        axes[0, 0].text(i, v + 0.03, f"{v:.1%}", ha="center", fontsize=8)

    axes[0, 1].bar(xt, mean_score, color=colors)
    axes[0, 1].set_title("Mean Jaccard score")
    for i, v in enumerate(mean_score):
        axes[0, 1].text(i, v + max(mean_score) * 0.05, f"{v:.4f}", ha="center", fontsize=8)

    axes[1, 0].bar(xt, coi, color=colors)
    axes[1, 0].set_ylim(0, 1)
    axes[1, 0].set_title("COI violations (must be 0)")
    for i, v in enumerate(coi):
        axes[1, 0].text(i, 0.05, str(v), ha="center", fontsize=10, fontweight="bold")

    axes[1, 1].bar(xt, fallback, color=colors)
    axes[1, 1].set_ylim(0, max(fallback + [0.1]) * 1.3)
    axes[1, 1].set_title("Fallback rate")
    for i, v in enumerate(fallback):
        axes[1, 1].text(i, v + 0.01, f"{v:.1%}", ha="center", fontsize=8)

    fig.suptitle("Phân công phản biện (Assignment optimization)", fontsize=12)
    fig.tight_layout()
    path = FIGURES / "fig03_assignment_metrics.png"
    fig.savefig(path, dpi=160)
    plt.close(fig)
    return path


def chart_load_balance(assignment: pd.DataFrame) -> Path:
    methods = list(assignment["method"])
    labels = {"greedy": "Greedy", "round_robin": "Round-robin", "random": "Random"}
    colors = [PALETTE["prod"] if m == "greedy" else PALETTE["amber"] if m == "round_robin" else PALETTE["slate"] for m in methods]
    stddev = [float(assignment[assignment["method"] == m]["load_stddev"].iloc[0]) for m in methods]
    gini = [float(assignment[assignment["method"] == m]["load_gini"].iloc[0]) for m in methods]
    xt = [labels[m] for m in methods]

    fig, axes = plt.subplots(1, 2, figsize=(9.5, 4.5))
    axes[0].bar(xt, stddev, color=colors)
    axes[0].set_title("Load StdDev (cân bằng tải)")
    axes[0].set_ylabel("Độ lệch chuẩn số bài / reviewer")
    for i, v in enumerate(stddev):
        axes[0].text(i, v + 0.2, f"{v:.2f}", ha="center", fontsize=8)

    axes[1].bar(xt, gini, color=colors)
    axes[1].set_title("Load Gini (0 = hoàn toàn đều)")
    axes[1].set_ylabel("Hệ số Gini")
    for i, v in enumerate(gini):
        axes[1].text(i, v + max(gini) * 0.05, f"{v:.3f}", ha="center", fontsize=8)

    fig.suptitle("Cân bằng tải giữa các phương pháp phân công")
    fig.tight_layout()
    path = FIGURES / "fig04_load_balance.png"
    fig.savefig(path, dpi=160)
    plt.close(fig)
    return path


def chart_synthetic_vs_real(compare: pd.DataFrame) -> Path:
    label_map = {
        "jaccard_mrr": "MRR",
        "jaccard_hit_at_5": "Hit@5",
        "jaccard_hit_at_10": "Hit@10",
        "greedy_mean_score": "Mean score\n(assignment)",
        "greedy_coverage": "Coverage",
    }
    metrics = list(compare["metric"])
    labels = [label_map[m] for m in metrics]
    synth = [float(compare[compare["metric"] == m]["synthetic"].iloc[0]) for m in metrics]
    real = [float(compare[compare["metric"] == m]["real"].iloc[0]) for m in metrics]
    delta = [float(compare[compare["metric"] == m]["relative_change_pct"].iloc[0]) for m in metrics]

    fig, axes = plt.subplots(1, 2, figsize=(11, 4.8))
    x = range(len(labels))
    axes[0].bar([i - 0.18 for i in x], synth, 0.36, label="Synthetic", color=PALETTE["amber"])
    axes[0].bar([i + 0.18 for i in x], real, 0.36, label="Real (S2)", color=PALETTE["prod"])
    axes[0].set_xticks(list(x))
    axes[0].set_xticklabels(labels, fontsize=8)
    axes[0].set_title("Synthetic vs Real")
    axes[0].legend(frameon=False)
    axes[0].set_ylabel("Giá trị chỉ số")

    bar_colors = [PALETTE["mint"] if d >= 0 else PALETTE["coral"] for d in delta]
    axes[1].bar(labels, delta, color=bar_colors)
    axes[1].axhline(0, color=PALETTE["slate"], linewidth=1)
    axes[1].set_title("Thay đổi tương đối Real / Synthetic (%)")
    axes[1].set_ylabel("%")
    for i, v in enumerate(delta):
        axes[1].text(i, v + (2 if v >= 0 else -6), f"{v:+.1f}%", ha="center", fontsize=8)

    fig.suptitle("Ổn định benchmark: synthetic vs dữ liệu Semantic Scholar thật")
    fig.tight_layout()
    path = FIGURES / "fig05_synthetic_vs_real.png"
    fig.savefig(path, dpi=160)
    plt.close(fig)
    return path


def chart_headline(headline: dict, fixture: dict) -> Path:
    items = [
        ("MRR\n(Jaccard)", headline["reviewer_ranking"]["mrr"], "0–1"),
        ("Hit@5", headline["reviewer_ranking"]["hit_at_5"], "0–1"),
        ("MRR × vs\nrandom", headline["reviewer_ranking"]["mrr_vs_random_multiplier"], "×"),
        ("Mean score\n× vs baseline", headline["assignment"]["mean_score_vs_baseline_multiplier"], "×"),
        ("COI\nviolations", headline["assignment"]["coi_violations"], "count"),
        ("Coverage\n(greedy)", headline["assignment"]["coverage"], "0–1"),
    ]
    fig, ax = plt.subplots(figsize=(10, 4.2))
    colors = [PALETTE["prod"], PALETTE["teal"], PALETTE["mint"], PALETTE["amber"], PALETTE["coral"], PALETTE["ink"]]
    bars = ax.bar([i[0] for i in items], [i[1] for i in items], color=colors)
    for bar, (label, val, unit) in zip(bars, items):
        txt = f"{val:g}" if unit == "count" else (f"{val:.2f}" if unit == "0–1" else f"{val:g}×")
        ax.text(
            bar.get_x() + bar.get_width() / 2,
            bar.get_height() + max(0.05, abs(bar.get_height()) * 0.03),
            txt,
            ha="center",
            fontsize=9,
            fontweight="bold",
            color=PALETTE["ink"],
        )
    ax.set_title(
        f"Headline — matching quality (n={fixture['loo_queries']} LOO queries, "
        f"{fixture['authors']} authors, {fixture['papers']} papers)"
    )
    ax.set_ylabel("Giá trị")
    # Hide y for mixed units; values labeled on bars
    ax.set_ylim(0, max(i[1] for i in items) * 1.25 + 0.5)
    fig.tight_layout()
    path = FIGURES / "fig06_headline_metrics.png"
    fig.savefig(path, dpi=160)
    plt.close(fig)
    return path


def write_figure_index(paths: list[tuple[str, str, str]]) -> None:
    lines = [
        "# Figure index — deterministic matching quality",
        "",
        "Sinh tự động từ `scripts/export_benchmark_to_excel.py`.",
        "Dùng PNG trong `exports/figures/` cho Chương 4/5 (lớp thuật toán xác định).",
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
            "- `deterministic_benchmark_results.xlsx`",
            "  - `Overview` — headline + fixture",
            "  - `Ranking` — Hit@k / MRR / nDCG theo method",
            "  - `Assignment` — coverage / load / COI / score",
            "  - `Quality_Long` — CSV gốc (long format)",
            "  - `Fixture` — thống kê dataset S2",
            "  - `Synthetic_vs_Real` — so sánh synthetic vs real",
            "  - `Headline` — chỉ số tóm tắt cho slide",
            "",
            "## Caveats (bắt buộc khi trích vào báo cáo)",
            "",
            "1. Ground truth ranking = leave-one-out authorship proxy — không phải gold reviewer assignment.",
            "2. Absolute mean Jaccard score thấp (0.011) do lexical ceiling; so sánh **tương đối** với baseline mới có ý nghĩa.",
            "3. Greedy coverage 65.9% là thiết kế quality-first; phần còn lại do chair gán thủ công.",
            "4. COI violations = 0 trên mọi method trong benchmark này (self-author constraint).",
            "5. Dataset 60 authors đủ so sánh thuật toán, chưa thay cho đánh giá hội nghị quy mô lớn.",
            "",
        ]
    )
    (EXPORT / "FIGURE_INDEX.md").write_text("\n".join(lines), encoding="utf-8")


def main() -> None:
    EXPORT.mkdir(parents=True, exist_ok=True)
    FIGURES.mkdir(parents=True, exist_ok=True)
    apply_style()

    long_df = load_quality_long()
    ranking = load_ranking_wide(long_df)
    assignment = load_assignment_wide(long_df)
    fixture = read_json(INPUT / "fixture_meta.json")
    headline = read_json(INPUT / "headline_metrics.json")
    compare = load_synthetic_compare()
    overview = build_overview(ranking, assignment, fixture, headline)

    fixture_df = pd.DataFrame(
        [
            {"field": k, "value": json.dumps(v, ensure_ascii=False) if isinstance(v, (list, dict)) else v}
            for k, v in fixture.items()
        ]
    )
    headline_df = pd.DataFrame(
        [
            {
                "group": "ranking",
                "metric": k,
                "value": v,
            }
            for k, v in headline["reviewer_ranking"].items()
        ]
        + [
            {
                "group": "assignment",
                "metric": k,
                "value": v if not isinstance(v, list) else ", ".join(v),
            }
            for k, v in headline["assignment"].items()
        ]
    )

    xlsx_path = EXPORT / "deterministic_benchmark_results.xlsx"
    with pd.ExcelWriter(xlsx_path, engine="openpyxl") as writer:
        write_df(writer, overview, "Overview")
        write_df(writer, ranking, "Ranking")
        write_df(writer, assignment, "Assignment")
        write_df(writer, long_df, "Quality_Long")
        write_df(writer, fixture_df, "Fixture")
        write_df(writer, compare, "Synthetic_vs_Real")
        write_df(writer, headline_df, "Headline")

    fig_meta: list[tuple[str, str, str]] = []
    p = chart_ranking_metrics(ranking)
    fig_meta.append((p.name, "Hit@k / MRR / nDCG theo method (jaccard, overlap, random)", "Chương 4 — ranking quality"))
    p = chart_ranking_vs_random(ranking)
    fig_meta.append((p.name, "Jaccard vs random + hệ số cải thiện", "Chương 4 — giá trị thuật toán"))
    p = chart_assignment(assignment)
    fig_meta.append((p.name, "Coverage / mean score / COI / fallback", "Chương 4 — assignment optimization"))
    p = chart_load_balance(assignment)
    fig_meta.append((p.name, "Load StdDev và Gini theo method", "Chương 4 — cân bằng tải"))
    p = chart_synthetic_vs_real(compare)
    fig_meta.append((p.name, "Synthetic vs real S2 + % thay đổi", "Chương 4 — độ ổn định benchmark"))
    p = chart_headline(headline, fixture)
    fig_meta.append((p.name, "Headline metrics matching quality", "Chương 4/5 — tóm tắt"))

    write_figure_index(fig_meta)
    print("Wrote:", xlsx_path)
    print("Figures:", FIGURES)
    print("Charts:", len(fig_meta))


if __name__ == "__main__":
    main()
