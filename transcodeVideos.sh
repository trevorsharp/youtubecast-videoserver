#!/bin/bash

downloadDirectory="/download"
contentDirectory="/content"

mkdir -p "$downloadDirectory"
mkdir -p "$contentDirectory"

for file in "$downloadDirectory"/*.transcode; do
    if [[ -f "$file" ]]; then
        exit 0
    fi
done

for file in "$downloadDirectory"/*.transcode.queue; do
    if [[ -f "$file" ]]; then
        videoId=$(basename "$file" | cut -d '.' -f 1)

        mv $file "$downloadDirectory/$videoId.transcode"

        echo "Starting to transcode $videoId"
        
        videoCodec=$(ffprobe \
            -v error \
            -select_streams v:0 \
            -show_entries stream=codec_name \
            -of default=noprint_wrappers=1:nokey=1 \
            "$downloadDirectory/$videoId.video" \
            | head -n 1)

        if [ "$videoCodec" = "h264" ]; then
            ffmpeg \
                -hide_banner \
                -i "$downloadDirectory/$videoId.video" \
                -i "$downloadDirectory/$videoId.audio" \
                -c:v copy \
                -c:a copy \
                -f hls \
                -hls_playlist_type vod \
                -hls_flags single_file \
                "$downloadDirectory/$videoId.m3u8"
        else
            ffmpeg \
                -hide_banner \
                -i "$downloadDirectory/$videoId.video" \
                -i "$downloadDirectory/$videoId.audio" \
                -c:v libx264 \
                -c:a copy \
                -preset veryfast \
                -r 30 \
                -f hls \
                -hls_playlist_type vod \
                -hls_flags single_file \
                "$downloadDirectory/$videoId.m3u8"
        fi

        rsync -avh "$downloadDirectory/$videoId.ts" "$contentDirectory/$videoId.ts"
        rsync -avh "$downloadDirectory/$videoId.m3u8" "$contentDirectory/$videoId.m3u8"

        rm "$downloadDirectory/$videoId.video" "$downloadDirectory/$videoId.audio"
        rm "$downloadDirectory/$videoId.transcode"

        echo "Finished transcoding $videoId"
    fi
done