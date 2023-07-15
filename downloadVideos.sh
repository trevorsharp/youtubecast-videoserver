#!/bin/bash

videoDirectory="/content"
maxHeight=$VIDEO_QUALITY

mkdir -p "$videoDirectory"

for file in "$videoDirectory"/*.download; do
    if [[ -f "$file" ]]; then
        videoId=$(basename "$file" | cut -d '.' -f 1)

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
    fi
done