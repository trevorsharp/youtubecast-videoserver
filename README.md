# YouTubeCast Video Server

Video server to download and host high quality video files for YouTubeCast.  
Unfamiliar with YouTubeCast? — Go to [youtubecast.com](https://youtubecast.com) to check it out!

## Features

- Download YouTube videos at 1080p and above
- Automatically download new videos on your server when your YouTubeCast feed updates
- Serve videos from your server to your podcast app at full quality via YouTubeCast feed

## Self-Hosted Setup Using Docker

Prerequisites:

- Ensure Docker is set up and running on your machine (https://docs.docker.com/get-docker)
- Set up a hostname that can be used to access your machine from the internet (can use a static IP address as well)
- Storage space large enough to store many large video files
- CPU strong enough to transcode videos into h264 (required when using quality above 1080p)

To run this application using Docker:

1. Create the `docker-compose.yml` file as described below
2. Run `docker-compose up -d` in the folder where your `docker-compose.yml` lives
3. Check the logs using `docker-compose logs -f` to see if there are any errors in your configuration
4. Add `?videoServer=example.com` to the end of your YouTubeCast feed url (replace `example.com` with your hostname)
5. Go to `https://youtubecast.com?setVideoServer=example.com` to save your video server's address in your browser's cookies. All feeds generated from that browser will automatically append `?videoServer=example.com` to your feed URLs (replace `example.com` with your hostname)

### docker-compose.yml

```
version: '3'
services:
  youtubecast-videoserver:
    image: trevorsharp/youtubecast-videoserver:latest
    container_name: youtubecast-videoserver
    restart: unless-stopped
    ports:
      - 80:80
    volumes:
      - ./content:/content
    environment:
      - VIDEO_QUALITY=2160
      - VIDEOS_PER_FEED=3
      - CLEANUP_INTERVAL=1
```

1. Create a file named `docker-compose.yml` with the contents above.
2. Point the volume for `/content` to the folder where you want your video files to be stored.
3. Add the maximum quality to download based on video height (`2160`, `1440`, `1080`, `720`, `480`, or `360`)
4. Add the minimum number of videos to keep downloaded per feed (at least 1)
5. Add the interval for how frequently to cleanup old video files (in days / at least 1)
