#!/bin/bash

videoDirectory=$1

for file in "$videoDirectory"/*.transcode; do
    if [[ -f "$file" ]]; then
        videoId=$(basename "$file" | cut -d '.' -f 1)
        
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

        rm "$videoDirectory/$videoId.video" "$videoDirectory/$videoId.audio" "$videoDirectory/$videoId.transcode"
    fi
done