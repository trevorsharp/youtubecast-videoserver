FROM oven/bun

RUN apt-get update && \
  apt-get install -y --no-install-recommends ffmpeg python3 python3-pip bash rsync wget cron

RUN set -x && \
  wget https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp -O /usr/bin/yt-dlp && \
  chmod a+x /usr/bin/yt-dlp

WORKDIR /app

COPY ./package.json ./package.json
COPY ./bun.lockb ./bun.lockb
RUN bun install

COPY ./src ./src
COPY ./tsconfig.json ./tsconfig.json

COPY ./downloadVideos.sh ./downloadVideos.sh
COPY ./transcodeVideos.sh ./transcodeVideos.sh

RUN chmod +x ./downloadVideos.sh
RUN chmod +x ./transcodeVideos.sh

COPY ./download-transcode-cron /etc/cron.d/download-transcode-cron
RUN chmod 0644 /etc/cron.d/download-transcode-cron

EXPOSE 80

CMD yt-dlp -U && \
  yt-dlp --version && \
  rm -f /var/log/download.log /var/log/transcode.log && \
  touch /var/log/download.log /var/log/transcode.log && \
  cron && \
  crontab /etc/cron.d/download-transcode-cron && \
  bun start
