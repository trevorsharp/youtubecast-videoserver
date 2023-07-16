#!/bin/bash

downloadDirectory="$DOWNLOAD_FOLDER"
maxHeight=$VIDEO_QUALITY

if [ ! -n "$downloadDirectory" ]; then
    downloadDirectory="/content"
fi


mkdir -p "$downloadDirectory"

for file in "$downloadDirectory"/*.download; do
    if [[ -f "$file" ]]; then
        exit 0
    fi
done

for file in "$downloadDirectory"/*.download.queue; do
    if [[ -f "$file" ]]; then
        videoId=$(basename "$file" | cut -d '.' -f 1)

        mv "$file" "$downloadDirectory/$videoId.download"

        echo -e "\n-------------------------------\n"
        echo "Starting Download ($videoId)"
        echo -e "\n-------------------------------\n"

        if [ -e cookies.txt ]
        then
            yt-dlp \
                -f "bv[height<=${maxHeight}]" \
                -S "height,ext,+tbr" \
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
                -S "height,ext,+tbr" \
                -o "$downloadDirectory/%(id)s.video" \
                "https://youtube.com/watch?v=$videoId"

            yt-dlp \
                -f "ba[ext=m4a]" \
                -o "$downloadDirectory/%(id)s.audio" \
                "https://youtube.com/watch?v=$videoId"
        fi

        mv "$downloadDirectory/$videoId.download" "$downloadDirectory/$videoId.transcode.queue"

        echo -e "\n-------------------------------\n"
        echo "Finished Download ($videoId)"
        echo -e "\n-------------------------------\n"
    fi
done