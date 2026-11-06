"""Step-by-step app for chapter 1. Start simple, then grow it.

Run:  uvicorn app.main:app --reload   (from 01-scaling/)
"""
import os
import socket

from fastapi import FastAPI

app = FastAPI()
USERS: dict[int, dict] = {1: {"id": 1, "name": "alice"}}  # TODO: replace with Postgres


@app.get("/health")
def health():
    # hostname lets you see which replica served the request behind nginx
    return {"ok": True, "host": socket.gethostname()}


@app.get("/users/{user_id}")
def get_user(user_id: int):
    # TODO step 4: read from replica; step 5: wrap in CacheAside backed by Redis
    return USERS.get(user_id) or {"error": "not found"}
