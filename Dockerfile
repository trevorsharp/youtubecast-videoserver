FROM alpine:latest

USER root
WORKDIR /

RUN apk add --no-cache curl ffmpeg python3 py3-pip bash rsync

RUN set -x && \
  wget https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp -O /usr/bin/yt-dlp && \
  chmod a+x /usr/bin/yt-dlp

RUN apk add gcompat && \
  wget -q -O /etc/apk/keys/sgerrand.rsa.pub https://alpine-pkgs.sgerrand.com/sgerrand.rsa.pub && \
  wget https://github.com/sgerrand/alpine-pkg-glibc/releases/download/2.35-r0/glibc-2.35-r0.apk && \
  wget https://github.com/sgerrand/alpine-pkg-glibc/releases/download/2.35-r0/glibc-bin-2.35-r0.apk && \
  apk --no-cache --force-overwrite add glibc-2.35-r0.apk glibc-bin-2.35-r0.apk && \
  /usr/glibc-compat/bin/ldd /lib/ld-linux-x86-64.so.2 

RUN curl -fsSL https://bun.sh/install | bash && \
  cp ~/.bun/bin/bun /usr/bin/bun && \
  chmod a+x /usr/bin/bun

COPY ./package.json ./package.json
COPY ./bun.lockb ./bun.lockb
RUN /usr/bin/bun install

COPY ./src ./src
COPY ./tsconfig.json ./tsconfig.json

COPY ./downloadVideos.sh ./downloadVideos.sh
COPY ./transcodeVideos.sh ./transcodeVideos.sh

RUN chmod +x ./downloadVideos.sh
RUN chmod +x ./transcodeVideos.sh

COPY ./crontab /var/spool/cron/crontabs/root
RUN chmod 0644 /var/spool/cron/crontabs/root

EXPOSE 80

CMD /usr/bin/yt-dlp -U && \
  /usr/bin/yt-dlp --version && \
  (cp /app/cookies.txt /cookies.txt || true) && \
  rm -f /var/log/download.log /var/log/transcode.log && \
  touch /var/log/download.log /var/log/transcode.log && \
  crond && \
  bun start