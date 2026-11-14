# 14 · Design YouTube

> Phase 2: Classic product systems · Suggested time: 1-2 weeks · Notes: [Design YouTube](https://github.com/liquidslr/system-design-notes/tree/main/14.%20Youtube) · [Open the demo](https://anandmukul93.github.io/system-design-handson/site/chapter.html?ch=14-youtube)

**Concepts covered:** #48 CDN

## Goal
Build a mini video platform: resumable upload to object storage, a DAG-based transcoding pipeline with ffmpeg producing HLS renditions, and adaptive streaming playback.

## 1. Concepts
### Upload path
Clients upload directly to object storage with pre-signed URLs, so app servers never stream video bytes.

### Transcoding DAG
Split the video, encode resolutions, audio and thumbnails in parallel, then merge and package: a directed acyclic graph of tasks.

### Adaptive bitrate
HLS/DASH chop video into segments at several bitrates; the player switches quality as bandwidth changes.

### CDN and cost
Serve popular videos from the CDN and long-tail ones from origin storage to control cost.

## 2. Trade-offs and optimizations
- Parallel DAG stages speed transcoding but need a scheduler and retry logic.
- More renditions = better playback, more storage and compute.
- CDN for everything is fast and very expensive.

## 3. Demo
Upload a simulated video and watch the transcoding DAG execute stage by stage across a worker pool, then play the result while you change network bandwidth and see the player switch between renditions.

- **In the browser:** [14-youtube on the showcase site](https://anandmukul93.github.io/system-design-handson/site/chapter.html?ch=14-youtube). The demo runs in a sandbox; press **Edit source** to change [`demo/demo.js`](demo/demo.js) and **Run** it again.
- **Locally:** `make site`, then open <http://localhost:8000/site/chapter.html?ch=14-youtube>.

## 4. Build it
Before coding, copy [`../03-design-framework/DESIGN_TEMPLATE.md`](../03-design-framework/DESIGN_TEMPLATE.md) to `DESIGN.md` here and spend 45 minutes designing.

### What you'll build
- Upload API that hands out pre-signed URLs to MinIO (S3 API) and supports resumable multipart uploads.
- A transcoding DAG: split -> (video encode per resolution, audio encode, thumbnail) in parallel -> merge -> package as HLS.
- A DAG scheduler + task queue + workers (resource manager in the chapter) that run ffmpeg tasks in parallel.
- Metadata DB (video, status, renditions) and a completion handler that marks videos ready.
- A web page with hls.js that plays the adaptive stream from MinIO (your fake CDN).

### Milestones
- [ ] Make `pytest 14-youtube` pass (DAG topological scheduling).
- [ ] Upload a file to MinIO via a pre-signed URL from your API.
- [ ] Run the DAG on a real clip with ffmpeg producing 240p/480p/720p HLS.
- [ ] Play it with hls.js and throttle your network in devtools to watch bitrate switching.

### Starter files
- [`dag.py`](dag.py)
- [`tests/test_dag.py`](tests/test_dag.py)

The stubs raise `NotImplementedError` and the tests define "done". Run them locally, or press **Run Python tests** on the
chapter page to run them in your browser with Pyodide:

```bash
pytest 14-youtube
```

### Stretch goals
- [ ] Split video into GOP-aligned chunks and transcode chunks in parallel across workers.
- [ ] Retry failed tasks; mark non-recoverable errors and notify the uploader.
- [ ] Put nginx caching in front of MinIO as a CDN and measure origin offload.

### Suggested stack
Python 3.11, FastAPI, MinIO, ffmpeg, Redis (task queue), hls.js, pytest

## 5. Break it
- [ ] Fail a transcode task and watch retries.
- [ ] Run the DAG with one worker vs eight.
- [ ] Throttle bandwidth during playback.

## 6. Review
- Why upload via pre-signed URLs?
- What runs in parallel in the transcoding DAG?
- How does adaptive bitrate streaming work?
- How do you cut CDN costs?
- Compare your `DESIGN.md` and results with the [chapter notes](https://github.com/liquidslr/system-design-notes/tree/main/14.%20Youtube).

## Results
_Write your measurements, failure experiments and surprises here._
