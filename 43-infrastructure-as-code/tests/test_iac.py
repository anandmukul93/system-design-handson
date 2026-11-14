import pytest
from iac import CycleError, apply_order, destroy_order, plan, render


def test_plan_actions():
    desired = {"docker_network.app": {"name": "app"},
               "docker_container.db": {"image": "postgres:17", "env": "x"},
               "docker_container.web": {"image": "web:2", "port": 80}}
    state = {"docker_container.db": {"image": "postgres:16", "env": "x"},
             "docker_container.web": {"image": "web:2", "port": 8080},
             "docker_container.old": {"image": "old"}}
    assert plan(desired, state, force_new={"image"}) == [
        ("replace", "docker_container.db"),
        ("delete", "docker_container.old"),
        ("update", "docker_container.web"),
        ("create", "docker_network.app"),
    ]
    assert plan(state, state) == []


def test_ordering():
    deps = {"web": ["db", "net"], "db": ["net", "volume"], "net": [], "volume": []}
    assert apply_order(deps) == ["net", "volume", "db", "web"]
    assert destroy_order(deps) == ["web", "db", "volume", "net"]
    with pytest.raises(CycleError):
        apply_order({"a": ["b"], "b": ["a"]})


def test_render():
    t = "replicas: {{ .Values.replicas }}\nimage: {{ .Values.image.repo }}:{{ .Values.image.tag | default \"latest\" }}"
    assert render(t, {"replicas": 3, "image": {"repo": "web"}}) == "replicas: 3\nimage: web:latest"
    assert render(t, {"replicas": 1, "image": {"repo": "web", "tag": "v2"}}).endswith("web:v2")
    with pytest.raises(KeyError):
        render("{{ .Values.missing }}", {})
