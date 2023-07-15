FROM node:lts-alpine

RUN apk add --no-cache yarn ffmpeg python3 py3-pip bash 
RUN set -x && \
  wget https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp -O /usr/bin/yt-dlp && \
  chmod a+x /usr/bin/yt-dlp
RUN apt-get update && apt-get install -y cron

WORKDIR /app

COPY ./package.json ./package.json
COPY ./yarn.lock ./yarn.lock
RUN yarn

COPY ./src ./src
COPY ./tsconfig.json ./tsconfig.json
RUN yarn build

COPY ./downloadVideos.sh ./downloadVideos.sh
COPY ./transcodeVideos.sh ./transcodeVideos.sh
COPY ./crontab /etc/cron.d/crontab

RUN chmod +x ./downloadVideos.sh
RUN chmod +x ./transcodeVideos.sh
RUN chmod 0644 /etc/cron.d/crontab

RUN crontab /etc/cron.d/crontab

EXPOSE 80

CMD /usr/bin/yt-dlp -U && \
  /usr/bin/yt-dlp --version && \
  yarn start
