#!/bin/bash

videoDirectory=$1
videoId=$2
maxHeight=$3

mkdir -p "$videoDirectory"

touch "$videoDirectory/$videoId.download"

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

rm "$videoDirectory/$videoId.download"