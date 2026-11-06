"""Serve a synthetic web on localhost so you can crawl hard without hurting anyone.
Run: python fake_web.py  -> http://127.0.0.1:8900/host{0..49}/page{n}
TODO: add traps (/calendar/2024/01/01 -> next day forever), duplicate content, slow pages."""
import random

from aiohttp import web

N_HOSTS, PAGES_PER_HOST, LINKS = 50, 2000, 8


async def page(request):
    host, n = request.match_info["host"], int(request.match_info["n"])
    rnd = random.Random(f"{host}/{n}")
    links = [f"/host{rnd.randrange(N_HOSTS)}/page{rnd.randrange(PAGES_PER_HOST)}" for _ in range(LINKS)]
    body = "".join(f'<a href="{l}">{l}</a><br>' for l in links)
    return web.Response(text=f"<html><body><h1>{host} {n}</h1>{body}</body></html>", content_type="text/html")


app = web.Application()
app.router.add_get("/{host}/page{n}", page)

if __name__ == "__main__":
    web.run_app(app, host="127.0.0.1", port=8900)
