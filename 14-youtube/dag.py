"""Tiny DAG scheduler. Tasks are named; deps say which must finish first."""


class CycleError(Exception):
    pass


def stages(deps: dict[str, list[str]]) -> list[list[str]]:
    """Group tasks into stages that can run in parallel: stage 0 has no deps,
    stage i only depends on earlier stages. Sort names inside each stage.
    Raise CycleError on cycles. Every dep must also be a key (treat missing as error)."""
    raise NotImplementedError


def run(deps: dict[str, list[str]], tasks: dict, max_workers: int = 4) -> list[str]:
    """Execute tasks[name]() respecting deps using a ThreadPoolExecutor.
    Return names in completion order."""
    raise NotImplementedError


TRANSCODE_DAG = {
    "split": [],
    "video_240p": ["split"], "video_480p": ["split"], "video_720p": ["split"],
    "audio": ["split"], "thumbnail": ["split"],
    "merge": ["video_240p", "video_480p", "video_720p", "audio"],
    "package_hls": ["merge"],
}
