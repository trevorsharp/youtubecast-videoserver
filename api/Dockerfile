FROM node:lts-alpine

RUN apk add --no-cache yarn ffmpeg python3 py3-pip bash
RUN pip install pytube

WORKDIR /app

COPY ./package.json ./package.json
COPY ./yarn.lock ./yarn.lock
RUN yarn

COPY ./src ./src
COPY ./tsconfig.json ./tsconfig.json
RUN yarn build

COPY ./downloadVideos.sh ./downloadVideos.sh
COPY ./getVideoUrl.py ./getVideoUrl.py
COPY ./getAudioUrl.py ./getAudioUrl.py

RUN chmod +x ./downloadVideos.sh

EXPOSE 80

CMD pip install pytube && yarn start
