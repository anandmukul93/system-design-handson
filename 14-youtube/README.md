# 14 · Design YouTube

> Notes: [Design YouTube](https://github.com/liquidslr/system-design-notes/tree/main/14.%20Youtube) · Phase 2: Classic product systems · Suggested time: 1-2 weeks

## Goal
Build a mini video platform: resumable upload to object storage, a DAG-based transcoding pipeline with ffmpeg producing HLS renditions, and adaptive streaming playback.

## What you'll build
- Upload API that hands out pre-signed URLs to MinIO (S3 API) and supports resumable multipart uploads.
- A transcoding DAG: split -> (video encode per resolution, audio encode, thumbnail) in parallel -> merge -> package as HLS.
- A DAG scheduler + task queue + workers (resource manager in the chapter) that run ffmpeg tasks in parallel.
- Metadata DB (video, status, renditions) and a completion handler that marks videos ready.
- A web page with hls.js that plays the adaptive stream from MinIO (your fake CDN).

## Key concepts exercised
- Pre-signed upload URLs
- Transcoding DAG and parallelism
- Adaptive bitrate streaming (HLS/DASH)
- Blob storage + CDN
- Recoverable vs non-recoverable errors
- Cost optimizations (popular content on CDN)

## Milestones
- [ ] Make `pytest 14-youtube` pass (DAG topological scheduling).
- [ ] Upload a file to MinIO via a pre-signed URL from your API.
- [ ] Run the DAG on a real clip with ffmpeg producing 240p/480p/720p HLS.
- [ ] Play it with hls.js and throttle your network in devtools to watch bitrate switching.

## Stretch goals
- [ ] Split video into GOP-aligned chunks and transcode chunks in parallel across workers.
- [ ] Retry failed tasks; mark non-recoverable errors and notify the uploader.
- [ ] Put nginx caching in front of MinIO as a CDN and measure origin offload.

## Suggested stack
Python 3.11, FastAPI, MinIO, ffmpeg, Redis (task queue), hls.js, pytest

## Starter files
- `dag.py`
- `tests/test_dag.py`

The starter modules contain stubs that raise `NotImplementedError`. The tests describe the behaviour you need, so
they fail until you implement the stubs. Work test-first:

```bash
pytest 14-youtube
```

## Before you code
Copy `../03-design-framework/DESIGN_TEMPLATE.md` to `DESIGN.md` in this folder and spend 45 minutes on the design
first. After you finish building, come back and note what you'd change.

## Results
_Write your measurements here (throughput, latency, memory, failure experiments) and what surprised you._
