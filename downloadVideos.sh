#!/bin/bash

videoDirectory=$1
videoId=$2
maxHeight=$3

mkdir -p $videoDirectory

touch $videoDirectory/$videoId.temp

yt-dlp \
    -f "bv[height<=${maxHeight}]+ba[ext=m4a]" \
    -S "height,ext" \
    --merge-output-format=mkv \
    -o "$videoDirectory/%(id)s.%(ext)s" \
    $videoId

ffmpeg \
    -hide_banner \
    -loglevel quiet \
    -i "$videoDirectory/$videoId.mkv" \
    -c:v libx264 \
    -c:a copy \
    -preset veryfast \
    -r 30 \
    -f hls \
    -hls_playlist_type vod \
    -hls_flags single_file \
    $videoDirectory/$videoId.m3u8

rm $videoDirectory/$videoId.temp