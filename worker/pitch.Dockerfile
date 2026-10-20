# Basic Pitch (Spotify) melody transcription: audio → MIDI. Used by the worker for the melody draft.
FROM python:3.11-slim-bookworm
RUN apt-get update && apt-get install -y --no-install-recommends ffmpeg libsndfile1 && rm -rf /var/lib/apt/lists/*
RUN pip install --no-cache-dir "basic-pitch[onnx]==0.4.0" onnxruntime
ENV HOME=/tmp
WORKDIR /work
