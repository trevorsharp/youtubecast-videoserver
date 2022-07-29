#!/bin/bash

videoDirectory=$1
videoId=$2
maxHeight=$3

mkdir -p $videoDirectory

touch $videoDirectory/$videoId.temp

yt-dlp \
    -f "bv[height<=${maxHeight}]+ba[ext=m4a]" \
    --merge-output-format=mp4 \
    -o "$videoDirectory/%(id)s.temp.%(ext)s" \
    $videoId

rm $videoDirectory/$videoId.temp