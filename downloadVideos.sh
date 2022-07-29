#!/bin/bash

videoDirectory=$1
videoId=$2
maxHeight=$3

mkdir -p $videoDirectory

touch $videoDirectory/$videoId.temp

yt-dlp \
    -f "bv[height<=${maxHeight}]+ba[ext=m4a]" \
    --merge-output-format=mkv \
    -o "$videoDirectory/%(id)s.temp.%(ext)s" \
    $videoId

ffmpeg \
    -i "$videoDirectory/$videoId.mkv" \
    -c:v libx264 \
    -c:a copy \
    -preset veryfast \
    -r 30 \
    $videoDirectory/$videoId.mp4 < /dev/null

rm $videoDirectory/$videoId.temp