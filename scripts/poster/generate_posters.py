"""Generate the two ConferenceSpace poster variants."""

from pathlib import Path

from scripts.poster.version_a import build as build_version_a
from scripts.poster.version_b import build as build_version_b


ROOT = Path(__file__).resolve().parents[2]


def generate_all() -> tuple[str, str]:
    return build_version_a(), build_version_b()


def write_outputs(output_dir: Path | None = None) -> tuple[Path, Path]:
    output_dir = output_dir or ROOT / "output/poster"
    output_dir.mkdir(parents=True, exist_ok=True)
    poster_a, poster_b = generate_all()
    path_a = output_dir / "conferencespace-poster-a-research-poster.svg"
    path_b = output_dir / "conferencespace-poster-b-product-showcase.svg"
    path_a.write_text(poster_a, encoding="utf-8")
    path_b.write_text(poster_b, encoding="utf-8")
    return path_a, path_b


if __name__ == "__main__":
    for output in write_outputs():
        print(output)
