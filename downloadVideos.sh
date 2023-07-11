#!/bin/bash

videoDirectory=$1
videoId=$2
maxHeight=$3

mkdir -p "$videoDirectory"

touch "$videoDirectory/$videoId.temp"

if [ -e cookies.txt ]
then
    yt-dlp \
        -f "bv[height<=${maxHeight}]" \
        -S "height,ext" \
        -o "$videoDirectory/%(id)s.video" \
        --cookies cookies.txt \
        "https://youtube.com/watch?v=$videoId"

    yt-dlp \
        -f "ba[ext=m4a]" \
        -o "$videoDirectory/%(id)s.audio" \
        --cookies cookies.txt \
        "https://youtube.com/watch?v=$videoId"
else
    yt-dlp \
        -f "bv[height<=${maxHeight}]" \
        -S "height,ext" \
        -o "$videoDirectory/%(id)s.video" \
        "https://youtube.com/watch?v=$videoId"

    yt-dlp \
        -f "ba[ext=m4a]" \
        -o "$videoDirectory/%(id)s.audio" \
        "https://youtube.com/watch?v=$videoId"
fi

videoCodec=$(ffprobe \
    -v error \
    -select_streams v:0 \
    -show_entries stream=codec_name \
    -of default=noprint_wrappers=1:nokey=1 \
    "$videoDirectory/$videoId.video" \
    | head -n 1)

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
        "$videoDirectory/$videoId.m3u8"
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
        "$videoDirectory/$videoId.m3u8"
fi

rm "$videoDirectory/$videoId.video" "$videoDirectory/$videoId.audio" "$videoDirectory/$videoId.temp"