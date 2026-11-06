from mail_store import Mailbox


def test_folder_and_unread():
    m = Mailbox()
    a = m.deliver("u", "inbox", "<1@x>", "Hello", "first", ts=1)
    b = m.deliver("u", "inbox", "<2@x>", "Again", "second", ts=2)
    m.deliver("v", "inbox", "<3@x>", "Other", "user", ts=3)
    assert [e["id"] for e in m.list_folder("u", "inbox")] == [b, a]
    m.mark_read(b)
    assert [e["id"] for e in m.list_folder("u", "inbox", unread_only=True)] == [a]


def test_threading():
    m = Mailbox()
    a = m.deliver("u", "inbox", "<1@x>", "Plan", "lets meet", ts=1)
    b = m.deliver("u", "inbox", "<2@x>", "Re: Plan", "sure", ts=2, in_reply_to="<1@x>")
    c = m.deliver("u", "inbox", "<3@x>", "Re: Plan", "friday?", ts=3, in_reply_to="<2@x>")
    tid = m.emails[c]["thread_id"]
    assert tid == m.emails[a]["thread_id"]
    assert [e["id"] for e in m.thread(tid)] == [a, b, c]


def test_search_scoped_to_user():
    m = Mailbox()
    a = m.deliver("u", "inbox", "<1@x>", "Invoice March", "please pay", ts=1)
    m.deliver("u", "inbox", "<2@x>", "Lunch", "pay later", ts=2)
    m.deliver("v", "inbox", "<3@x>", "Invoice", "pay now", ts=3)
    assert m.search("u", "invoice pay") == [a]
