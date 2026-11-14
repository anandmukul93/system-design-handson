import pytest
from dag import TRANSCODE_DAG, CycleError, run, stages


def test_stages_transcode():
    assert stages(TRANSCODE_DAG) == [
        ["split"],
        ["audio", "thumbnail", "video_240p", "video_480p", "video_720p"],
        ["merge"],
        ["package_hls"],
    ]


def test_cycle():
    with pytest.raises(CycleError):
        stages({"a": ["b"], "b": ["a"]})


@pytest.mark.needs_threads
def test_run_respects_deps():
    done = []
    tasks = {name: (lambda n=name: done.append(n)) for name in TRANSCODE_DAG}
    order = run(TRANSCODE_DAG, tasks)
    pos = {n: i for i, n in enumerate(order)}
    for n, ds in TRANSCODE_DAG.items():
        assert all(pos[d] < pos[n] for d in ds)
    assert set(order) == set(TRANSCODE_DAG)
