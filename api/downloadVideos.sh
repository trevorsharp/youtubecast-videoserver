#!/bin/bash

videoDirectory=$1
videoId=$2
maxHeight=$3

youtubeBaseUrl="https://youtube.com/watch?v="
youtubeVideoUrl="$youtubeBaseUrl$videoId"

videoUrl=$(python3 getVideoUrl.py $youtubeVideoUrl $maxHeight)
audioUrl=$(python3 getAudioUrl.py $youtubeVideoUrl)

mkdir -p $videoDirectory

ffmpeg \
    -i $videoUrl \
    -i $audioUrl \
    -c:v libx264 \
    -c:a copy \
    -preset fast \
    $videoDirectory/$videoId.temp.mp4

mv $videoDirectory/$videoId.temp.mp4 $videoDirectory/$videoId.mp4