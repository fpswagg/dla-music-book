# Toolbox for the Myenge worker: MuseScore (score conversion), FluidSynth + GM soundfont (audio render), ffmpeg.
# MuseScore itself is mounted from the host (extracted AppImage) at /opt/musescore.
FROM debian:bookworm-slim
RUN apt-get update && apt-get install -y --no-install-recommends \
      libopengl0 libegl1 libgl1 libglib2.0-0 libfontconfig1 libfreetype6 libdbus-1-3 libnss3 libxkbcommon0 \
      libasound2 libjack0 libpulse0 libxcb1 libx11-6 libxcb-cursor0 libgssapi-krb5-2 \
      xvfb xauth libxcb-icccm4 libxcb-image0 libxcb-keysyms1 libxcb-randr0 libxcb-render-util0 libxcb-shape0 libxcb-xinerama0 libxcb-xkb1 libxkbcommon-x11-0 libxcb-xfixes0 libxcb-sync1 libxcb-shm0 libxrender1 libsm6 libice6 \
      fluidsynth fluid-soundfont-gm ffmpeg fonts-dejavu-core ca-certificates \
    && rm -rf /var/lib/apt/lists/*
ENV LANG=C.UTF-8 XDG_RUNTIME_DIR=/tmp HOME=/tmp
WORKDIR /work
