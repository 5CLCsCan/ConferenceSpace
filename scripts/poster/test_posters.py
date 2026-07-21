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
        self.assertIn("HÀNH TRÌNH THEO VAI TRÒ", self.poster_a)
        self.assertIn("BA ĐÓNG GÓP", self.poster_a)
        self.assertIn("MA TRẬN BẰNG CHỨNG", self.poster_b)

    def test_conflicting_legacy_chart_values_are_excluded(self) -> None:
        for poster in (self.poster_a, self.poster_b):
            self.assertNotIn("45,6%", poster)
            self.assertNotIn("57,1%", poster)
            self.assertNotIn("70,4%", poster)


if __name__ == "__main__":
    unittest.main()
