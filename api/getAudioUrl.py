#!/usr/bin/python
import sys
from pytube import YouTube

youtubeLink = sys.argv[1]

print(YouTube(youtubeLink).streams.filter(only_audio=True, mime_type='audio/mp4').order_by('abr').desc().first().url)