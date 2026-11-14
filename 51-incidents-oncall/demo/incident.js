// An incident as a state machine with a clock. A bad deploy starts hurting users at minute 0; the alert
// fires a few minutes later; every action the responder takes costs minutes; only the rollback fixes it.
//   MTTD  time to detect: impact → alert         MTTA  time to acknowledge: alert → ack
//   MTTR  time to recover: impact → mitigated
export const ACTIONS = {
  ack: { label: "Acknowledge the page", minutes: 1, result: "Acknowledged the alert" },
  dashboards: {
    label: "Check dashboards",
    minutes: 3,
    result: "Dashboards: error rate jumped at 14:02 on checkout-api, right after deploy 7f3a",
  },
  logs: {
    label: "Search logs by trace id",
    minutes: 4,
    result: "Logs: NullPointerException in PriceFormatter (new code path)",
  },
  rollback: {
    label: "Roll back deploy 7f3a",
    minutes: 5,
    result: "Rolled back checkout-api to the previous version",
  },
  failover: {
    label: "Fail over the database",
    minutes: 8,
    result: "Failed over the DB (did not help: the DB was healthy)",
  },
  page: {
    label: "Page the checkout team",
    minutes: 2,
    result: "Paged the checkout owner, who joined as incident commander",
  },
  status: {
    label: "Post a status page update",
    minutes: 1,
    result: "Posted status: investigating elevated checkout errors",
  },
};
const ALERT_FIRES_AT = 4;
const USERS_HURT_PER_MINUTE = 120;

export class Incident {
  constructor() {
    this.minute = 0;
    this.usersAffected = 0;
    this.detectedAt = null;
    this.acknowledgedAt = null;
    this.resolvedAt = null;
    this.timeline = [{ minute: 0, text: "Deploy 7f3a rolled out; errors start" }];
    this.actionsTaken = [];
  }
  get resolved() {
    return this.resolvedAt !== null;
  }
  get metrics() {
    return {
      mttd: this.detectedAt,
      mtta: this.acknowledgedAt === null ? null : this.acknowledgedAt - this.detectedAt,
      mttr: this.resolvedAt,
    };
  }
  // one minute passes with nobody fixing anything. returns [{ text, kind }]
  minutePasses() {
    if (this.resolved) return [];
    this.minute++;
    this.usersAffected += USERS_HURT_PER_MINUTE;
    if (this.minute === ALERT_FIRES_AT) {
      this.detectedAt = this.minute;
      this.timeline.push({ minute: this.minute, text: "Burn-rate alert fires and pages on-call" });
      return [{ text: `+${this.minute} min: PAGE: checkout error budget burning 20x`, kind: "bad" }];
    }
    if (this.detectedAt && this.acknowledgedAt === null && this.minute % 3 === 0)
      return [{ text: `+${this.minute} min: page escalates (not acknowledged)`, kind: "warn" }];
    return [];
  }
  // the responder does something. returns [{ text, kind }]
  act(key) {
    if (this.resolved) return [];
    if (!this.detectedAt && key !== "status")
      return [{ text: "nothing has alerted yet: users are hurting silently", kind: "warn" }];
    const action = ACTIONS[key];
    this.minute += action.minutes;
    this.usersAffected += action.minutes * USERS_HURT_PER_MINUTE; // users keep failing while we work
    this.actionsTaken.push(key);
    if (key === "ack") this.acknowledgedAt ??= this.minute;
    this.timeline.push({ minute: this.minute, text: action.result });
    const events = [
      { text: `+${this.minute} min: ${action.result}`, kind: key === "failover" ? "warn" : "ok" },
    ];
    if (key === "rollback") {
      this.resolvedAt = this.minute;
      events.push({ text: `+${this.minute} min: error rate back to baseline. Mitigated.`, kind: "ok" });
    }
    return events;
  }
}
