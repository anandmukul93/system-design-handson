"""45-minute mock interview timer. Run: python mock_timer.py [total_minutes]"""
import sys
import time

STEPS = [
    ("Understand the problem & scope", 0.15, "Who are the users? Scale? Must-have features?"),
    ("High-level design & buy-in", 0.30, "APIs, boxes and arrows, walk through main flow."),
    ("Deep dive", 0.40, "Bottlenecks, data model, scaling, consistency."),
    ("Wrap up", 0.15, "Recap, failure modes, monitoring, next steps."),
]


def main(total_min: float = 45):
    for name, share, prompt in STEPS:
        minutes = total_min * share
        print(f"\n== {name} ({minutes:.0f} min) ==\n   {prompt}")
        end = time.time() + minutes * 60
        try:
            while (left := end - time.time()) > 0:
                print(f"\r   {int(left // 60):02d}:{int(left % 60):02d} left  (Ctrl+C to skip)", end="", flush=True)
                time.sleep(1)
        except KeyboardInterrupt:
            pass
    print("\nDone. Write down what you missed in MISTAKES.md")


if __name__ == "__main__":
    main(float(sys.argv[1]) if len(sys.argv) > 1 else 45)
