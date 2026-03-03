from app.services.context_budget import ContextBudgetService


def test_split_for_compaction_keeps_recent_exchanges():
    svc = ContextBudgetService(threshold_ratio=0.7, keep_recent_exchanges=2)
    messages = [{"id": f"m{i}", "role": "user" if i % 2 == 0 else "assistant", "parts": []} for i in range(10)]
    older, recent = svc.split_for_compaction(messages)
    assert len(older) == 6
    assert len(recent) == 4


def test_should_compact_threshold():
    svc = ContextBudgetService(threshold_ratio=0.7, keep_recent_exchanges=12)
    assert svc.should_compact(estimated_tokens=700, model_context_window=1000)
    assert not svc.should_compact(estimated_tokens=699, model_context_window=1000)

