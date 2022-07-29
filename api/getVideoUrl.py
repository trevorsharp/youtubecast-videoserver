#!/usr/bin/python
import sys
from pytube import YouTube

youtubeLink = sys.argv[1]
maxHeight = sys.argv[2]

streams = YouTube(youtubeLink).streams.order_by("resolution").desc()

p2160 = streams.filter(resolution="2160p").first()
p1440 = streams.filter(resolution="1440p").first()
p1080 = streams.filter(resolution="1080p").first()

if maxHeight >= "2160" and p2160:
  print(p2160.url)
elif maxHeight >= "1440" and p1440:
  print(p1440.url)
elif p1080:
  print(p1080.url)