#!/bin/bash

videoDirectory=$1
videoId=$2
maxHeight=$3

mkdir -p $videoDirectory

touch $videoDirectory/$videoId.temp

yt-dlp \
    -f "bv[height<=${maxHeight}]" \
    -S "height,ext" \
    -o "$videoDirectory/%(id)s.video" \
    $videoId

yt-dlp \
    -f "ba[ext=m4a]" \
    -o "$videoDirectory/%(id)s.audio" \
    $videoId

videoCodec=$(ffprobe \
    -v error \
    -select_streams v:0 \
    -show_entries stream=codec_name \
    -of default=noprint_wrappers=1:nokey=1 \
    $videoDirectory/$videoId.video)

if [ "$videoCodec" = "h264" ]; then
    ffmpeg \
        -hide_banner \
        -i "$videoDirectory/$videoId.video" \
        -i "$videoDirectory/$videoId.audio" \
        -c:v copy \
        -c:a copy \
        -f hls \
        -hls_playlist_type vod \
        -hls_flags single_file \
        $videoDirectory/$videoId.m3u8
else
    ffmpeg \
        -hide_banner \
        -i "$videoDirectory/$videoId.video" \
        -i "$videoDirectory/$videoId.audio" \
        -c:v libx264 \
        -c:a copy \
        -preset veryfast \
        -r 30 \
        -f hls \
        -hls_playlist_type vod \
        -hls_flags single_file \
        $videoDirectory/$videoId.m3u8
fi

rm $videoDirectory/$videoId.temp $videoDirectory/$videoId.video $videoDirectory/$videoId.audio