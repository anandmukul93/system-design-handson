"""Run: uvicorn app:app --reload (from 08-url-shortener/)"""
from fastapi import FastAPI, HTTPException
from fastapi.responses import RedirectResponse
from pydantic import BaseModel

from shortener import Shortener

counter = iter(range(10**12, 10**13))
svc = Shortener(lambda: next(counter))  # TODO: use your chapter 7 Snowflake, Postgres, Redis
app = FastAPI()


class ShortenReq(BaseModel):
    longUrl: str


@app.post("/api/v1/data/shorten")
def shorten(req: ShortenReq):
    return {"shortUrl": svc.shorten(req.longUrl)}


@app.get("/{code}")
def redirect(code: str):
    url = svc.resolve(code)
    if not url:
        raise HTTPException(404)
    return RedirectResponse(url, status_code=301)
