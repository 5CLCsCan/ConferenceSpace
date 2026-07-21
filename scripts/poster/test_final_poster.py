import importlib
import importlib.util
import re
import unittest
from pathlib import Path


MODULE_NAME = "scripts.poster.final_poster"


class FinalPosterAvailabilityTest(unittest.TestCase):
    def test_final_poster_module_exists(self) -> None:
        self.assertIsNotNone(importlib.util.find_spec(MODULE_NAME))

    def test_dedicated_renderer_exists(self) -> None:
        self.assertTrue(Path("scripts/poster/render_final_poster.mjs").is_file())


@unittest.skipUnless(importlib.util.find_spec(MODULE_NAME), "final poster module not implemented")
class FinalPosterContractTest(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        cls.poster = importlib.import_module(MODULE_NAME).build()

    def test_uses_a0_landscape_canvas(self) -> None:
        self.assertIn('width="1189mm" height="841mm"', self.poster)
        self.assertIn('viewBox="0 0 1189 841"', self.poster)

    def test_contains_approved_takeaway_and_human_authority(self) -> None:
        required = (
            "CONFERENCE SPACE ĐẶT TỰ ĐỘNG HÓA VÀO ĐÚNG RANH GIỚI",
            "Nghiệp vụ xác định · đầu ra có thể kiểm tra · con người quyết định",
            "CON NGƯỜI XÁC NHẬN",
        )
        for marker in required:
            self.assertIn(marker, self.poster)

    def test_contains_report_evidence_with_scope(self) -> None:
        required = (
            "49,3%",
            "47,9%",
            "117,6",
            "71,8",
            "79,3",
            "MRR 0,392",
            "65,9%",
            "23,3%",
            "98,20%",
            "86,93%",
            "96,22%",
            "69,86%",
            "46,99%",
            "73/91",
            "20 VU × 30 giây",
            "dữ liệu tổng hợp",
            "mẫu lệch Tác giả",
        )
        for marker in required:
            self.assertIn(marker, self.poster)

    def test_embeds_three_report_screenshots_as_figures(self) -> None:
        sources = (
            "chapter_3_uc02_autofill_1.png",
            "chapter_3_uc05_reviewer_initial_analysis.png",
            "chapter_3_uc06_assignment_suggestions.png",
        )
        for source in sources:
            self.assertIn(f'data-source="{source}"', self.poster)
        self.assertGreaterEqual(self.poster.count("data:image/png;base64,"), 5)
        for figure in ("HÌNH 1", "HÌNH 2", "HÌNH 3"):
            self.assertIn(figure, self.poster)

    def test_distinguishes_workflow_algorithm_and_ai_marks(self) -> None:
        self.assertIn('id="core-workflow"', self.poster)
        self.assertIn('id="deterministic-assistance"', self.poster)
        self.assertIn('id="ai-assistance"', self.poster)
        self.assertIn("Submission Gating: quy tắc + cảnh báo nội dung", self.poster)

    def test_uses_academic_language_not_dashboard_placeholders(self) -> None:
        forbidden = (
            "UI PLACEHOLDER",
            "Evidence Dashboard",
            "Product Journey",
            "metric-card",
            "progress-bar",
        )
        for marker in forbidden:
            self.assertNotIn(marker, self.poster)
        self.assertLessEqual(self.poster.count('filter="url(#shadow)"'), 1)

    def test_all_declared_font_sizes_remain_print_legible(self) -> None:
        sizes = [float(value) for value in re.findall(r'font-size="([0-9.]+)"', self.poster)]
        self.assertTrue(sizes)
        self.assertGreaterEqual(min(sizes), 3.5)


if __name__ == "__main__":
    unittest.main()
