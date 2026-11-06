"""Double-entry ledger + idempotent payment service. Money is integer cents."""
from dataclasses import dataclass, field


class UnbalancedError(Exception):
    pass


@dataclass
class Ledger:
    entries: list = field(default_factory=list)  # (txn_id, account, debit, credit)

    def post(self, txn_id: str, lines: list[tuple[str, int, int]]) -> None:
        """lines = [(account, debit, credit), ...]. Total debits must equal total credits
        (else UnbalancedError, and nothing is written)."""
        raise NotImplementedError

    def balance(self, account: str) -> int:
        """credits - debits for the account."""
        raise NotImplementedError


class PSPError(Exception):
    pass


@dataclass
class PaymentService:
    psp: callable            # psp(order_id, amount) -> psp_ref; may raise PSPError
    ledger: Ledger
    orders: dict = field(default_factory=dict)   # idempotency_key -> {"status", "amount", "seller", "psp_ref"}

    def pay(self, idempotency_key: str, buyer: str, seller: str, amount: int) -> dict:
        """- If key already SUCCESS: return stored order without calling PSP again.
        - Otherwise call psp. On success: status SUCCESS, post ledger txn
          (debit buyer, credit seller), store psp_ref. On PSPError: status FAILED
          (a later call with the same key may retry).
        Return the order dict."""
        raise NotImplementedError


def reconcile(ledger_txns: dict[str, int], settlement: dict[str, int]) -> dict[str, list[str]]:
    """Compare txn_id -> amount maps. Return {"missing_in_ledger": [...], "missing_in_psp": [...],
    "amount_mismatch": [...]}, each list sorted."""
    raise NotImplementedError
