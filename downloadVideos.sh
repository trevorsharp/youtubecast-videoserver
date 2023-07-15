#!/bin/bash

downloadDirectory="/download"
maxHeight=$VIDEO_QUALITY

mkdir -p "$downloadDirectory"

for file in "$downloadDirectory"/*.download.queue; do
    if [[ -f "$file" ]]; then
        videoId=$(basename "$file" | cut -d '.' -f 1)

        mv $file "$downloadDirectory/$videoId.download"

        echo "Starting to download $videoId"

        if [ -e cookies.txt ]
        then
            yt-dlp \
                -f "bv[height<=${maxHeight}]" \
                -S "height,ext" \
                -o "$downloadDirectory/%(id)s.video" \
                --cookies cookies.txt \
                "https://youtube.com/watch?v=$videoId"

            yt-dlp \
                -f "ba[ext=m4a]" \
                -o "$downloadDirectory/%(id)s.audio" \
                --cookies cookies.txt \
                "https://youtube.com/watch?v=$videoId"
        else
            yt-dlp \
                -f "bv[height<=${maxHeight}]" \
                -S "height,ext" \
                -o "$downloadDirectory/%(id)s.video" \
                "https://youtube.com/watch?v=$videoId"

            yt-dlp \
                -f "ba[ext=m4a]" \
                -o "$downloadDirectory/%(id)s.audio" \
                "https://youtube.com/watch?v=$videoId"
        fi

        mv "$downloadDirectory/$videoId.download" "$downloadDirectory/$videoId.transcode.queue"

        echo "Finished downloading $videoId"
    fi
done