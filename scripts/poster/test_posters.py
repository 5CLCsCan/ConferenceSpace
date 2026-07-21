import importlib.util
import unittest
from pathlib import Path

from scripts.poster import generate_posters


class PosterGeneratorAvailabilityTest(unittest.TestCase):
    def test_generator_module_exists(self) -> None:
        self.assertIsNotNone(importlib.util.find_spec("scripts.poster.generate_posters"))

    def test_generator_exposes_generate_all(self) -> None:
        self.assertTrue(hasattr(generate_posters, "generate_all"))

    def test_renderer_entrypoint_exists(self) -> None:
        self.assertTrue(Path("scripts/poster/render_posters.mjs").is_file())

    def test_renderer_isolates_each_poster_in_a_fresh_browser(self) -> None:
        renderer = Path("scripts/poster/render_posters.mjs").read_text(encoding="utf-8")
        self.assertIn("async function renderPoster", renderer)
        self.assertIn("spawn(process.execPath", renderer)
        self.assertIn('"--single"', renderer)


class PosterContentTest(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        cls.poster_a, cls.poster_b = generate_posters.generate_all()

    def test_both_posters_use_a0_landscape_viewbox(self) -> None:
        for poster in (self.poster_a, self.poster_b):
            self.assertIn('viewBox="0 0 1189 841"', poster)

    def test_both_posters_include_locked_metrics(self) -> None:
        required = (
            "p95 &lt; 120 ms",
            "MRR 0,392",
            "65,9%",
            "98,20%",
            "96,22%",
            "87,34%",
            "46,99%",
            "73/91",
        )
        for poster in (self.poster_a, self.poster_b):
            for marker in required:
                self.assertIn(marker, poster)

    def test_ui_regions_are_editable_placeholders(self) -> None:
        required = ("UI PLACEHOLDER", "TÁC GIẢ", "PHẢN BIỆN VIÊN", "CHỦ TỌA")
        for poster in (self.poster_a, self.poster_b):
            for marker in required:
                self.assertIn(marker, poster)

    def test_ui_placeholders_have_stable_group_ids(self) -> None:
        required = (
            'id="ui-placeholder-author"',
            'id="ui-placeholder-reviewer"',
            'id="ui-placeholder-chair"',
        )
        for poster in (self.poster_a, self.poster_b):
            for marker in required:
                self.assertIn(marker, poster)

    def test_variants_have_distinct_story_structures(self) -> None:
        self.assertIn("TỪ QUY TRÌNH RỜI RẠC ĐẾN MỘT VÒNG ĐỜI CÓ KIỂM SOÁT", self.poster_a)
        self.assertIn("CON NGƯỜI GIỮ QUYỀN QUYẾT ĐỊNH", self.poster_b)
        for poster in (self.poster_a, self.poster_b):
            self.assertIn('id="dominant-figure"', poster)

    def test_identity_text_matches_compiled_report(self) -> None:
        required = (
            "Cao Hữu Khương Duy — 22127083",
            "Nhâm Đức Huy — 22127158",
            "Võ Minh Khôi — 22127213",
            "Từ Chí Tiến — 22127414",
            "Nguyễn Ngọc Anh Tú — 22127433",
            "ThS. Hồ Thị Hoàng Vy",
            "PGS.TS. Lê Nguyễn Hoài Nam",
        )
        for poster in (self.poster_a, self.poster_b):
            for marker in required:
                self.assertIn(marker, poster)

    def test_posters_use_print_language_not_dashboard_cards(self) -> None:
        for poster in (self.poster_a, self.poster_b):
            self.assertLessEqual(poster.count('filter="url(#shadow)"'), 4)
            self.assertNotIn("Evidence Dashboard", poster)
            self.assertNotIn("Product Journey", poster)

    def test_conflicting_legacy_chart_values_are_excluded(self) -> None:
        for poster in (self.poster_a, self.poster_b):
            self.assertNotIn("45,6%", poster)
            self.assertNotIn("57,1%", poster)
            self.assertNotIn("70,4%", poster)


if __name__ == "__main__":
    unittest.main()
