from dispatcher import Dispatcher, Notification, ProviderError


def ok(n):
    pass


def failing(n):
    raise ProviderError("boom")


def test_sent_and_dedupe():
    d = Dispatcher(providers={"email": ok})
    n = Notification("e1", "u1", "email", "hi")
    assert d.handle(n) == "sent"
    assert d.handle(Notification("e1", "u1", "email", "hi")) == "duplicate"


def test_opt_out():
    d = Dispatcher(providers={"sms": ok}, opted_out={("u1", "sms")})
    assert d.handle(Notification("e2", "u1", "sms", "hi")) == "opted_out"


def test_retry_then_dead():
    d = Dispatcher(providers={"push": failing}, max_attempts=3)
    n = Notification("e3", "u1", "push", "hi")
    assert [d.handle(n) for _ in range(3)] == ["retry", "retry", "dead"]
    assert d.dead_letters == [n]


def test_backoff():
    d = Dispatcher(providers={})
    assert [d.backoff_seconds(a) for a in range(1, 5)] == [1, 2, 4, 8]
    assert d.backoff_seconds(20) == 60
