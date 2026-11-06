"""Measure a few latencies on your machine. Run: python latency_bench.py"""
import os
import socket
import tempfile
import time


def timeit(fn, n=1000):
    start = time.perf_counter_ns()
    for _ in range(n):
        fn()
    return (time.perf_counter_ns() - start) / n


def main():
    data = bytearray(os.urandom(1_000_000))
    print(f"read 1 MB from memory: {timeit(lambda: bytes(data), 200):,.0f} ns")
    # TODO: random 4KB reads from a large temp file (SSD), with O_DIRECT if you can
    # TODO: localhost TCP round trip using socket.socketpair()
    # TODO: compare to the table in the chapter and note the gaps


if __name__ == "__main__":
    main()
