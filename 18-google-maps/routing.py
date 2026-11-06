"""Shortest paths on a weighted directed graph: {node: [(neighbor, cost), ...]}.
Return (total_cost, path_list, nodes_expanded). Unreachable -> (inf, [], expanded)."""
import heapq
import math


def dijkstra(graph, start, goal):
    raise NotImplementedError


def astar(graph, start, goal, heuristic):
    """heuristic(node, goal) must never overestimate the true cost."""
    raise NotImplementedError


def tile_of(x: float, y: float, tile_size: float) -> tuple[int, int]:
    """Which routing tile a coordinate falls in (floor division)."""
    return (math.floor(x / tile_size), math.floor(y / tile_size))
