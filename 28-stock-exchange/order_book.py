"""Single-symbol limit order book with price-time priority.

Prices and quantities are ints. Side is "buy" or "sell".
add() returns a list of fills: {"taker", "maker", "price", "qty"} where price
is the MAKER's price. Unfilled remainder rests on the book."""
from collections import OrderedDict, deque


class OrderBook:
    def __init__(self):
        self.bids: dict[int, deque] = {}   # price -> deque of [order_id, qty]
        self.asks: dict[int, deque] = {}
        self.orders: dict[str, tuple[str, int]] = {}  # order_id -> (side, price)

    def add(self, order_id: str, side: str, price: int, qty: int) -> list[dict]:
        raise NotImplementedError

    def cancel(self, order_id: str) -> bool:
        raise NotImplementedError

    def best_bid(self) -> int | None:
        raise NotImplementedError

    def best_ask(self) -> int | None:
        raise NotImplementedError

    def depth(self, levels: int = 5) -> dict:
        """{"bids": [(price, total_qty), ...] best first, "asks": [...] best first}"""
        raise NotImplementedError
