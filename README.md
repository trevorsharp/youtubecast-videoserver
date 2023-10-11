# YouTubeCast Video Server

Video server to serve high quality video for YouTubeCast.  
Unfamiliar with YouTubeCast? — Go to [youtubecast.com](https://youtubecast.com) to check it out!

## Features

- Serve YouTube videos at 1080p and above
- Automatically download new videos on your server when your YouTubeCast feed updates
- Serve videos from YouTube or your server to your podcast app at full quality via YouTubeCast feed

## Quality Options

### Available directly with YouTubeCast

- 720p
- 360p
- Audio Only

### Available only with YouTubeCast Video Server

- Adaptive Quality\*
- 2160p\*
- 1440p\*
- 1080p
- 480p

\*Downloading and transcoding required on server for 1440p and 2160p

## Self-Hosted Setup Using Docker

Prerequisites:

- Ensure Docker is set up and running on your machine (https://docs.docker.com/get-docker)
- Set up a hostname that can be used to access your machine from the internet (can use a static IP address as well)
- Storage space large enough to store many large video files (required for 1440p, 2160p or when downloading is enabled)
- CPU capable of transcoding videos to H.264 (required for 1440p or 2160p)

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
      - ./download:/download
      - ./cookies.txt:/app/cookies.txt
      - ./log:/var/log
    environment:
      - MAX_QUALITY=2160
      - MAX_DOWNLOADS_PER_FEED=5
      - ADAPTIVE_QUALITY=1
      - MIN_QUALITY=720
```

1. Create a file named `docker-compose.yml` with the contents above
2. Optional - Point the file for `/app/cookies.txt` to where you are storing a cookies.txt file (used for members-only content)
3. Optional - Point the volume for `/var/log` to wherever you want to store additional logs for downloading and transcoding. This is useful when debugging.

### Environment Variables

`MAX_QUALITY` - Maximum quality of video to serve (1080p and below can be streamed directly from YouTube without requiring downloads on the server)

- Number (One of `360`, `480`, `720`, `1080`, `1440`, `2160`)
- Default: `1080`
- ⚠️ Setting to `2160` or `1440` will significantly increase storage and CPU usage

`CONTENT_FOLDER` - Folder to store and serve video files

- Folder path
- Default: `/content`

`DOWNLOAD_FOLDER` - Folder to temp store video files while downloading and transcoding

- Folder path
- Default: `/download`
- ⚠️ For optimal performance, use a folder on an internal disk and not network- or direct-attached storage

`ADAPTIVE_QUALITY` - Enables players to adapt quality based on network conditions

- Boolean (`0` or `1`)
- Default: `0`

`MIN_QUALITY` - Minimum quality to allow when adaptive streaming is enabled

- Number (One of `360`, `480`, `720`, `1080`)
- Default: `360`
- ⚠️ Setting to higher value may result in buffering depending on network speed

`MAX_DOWNLOADS_PER_FEED` - Maximum number of videos to have downloaded per feed

- Number (Positive integer or `-1` to keep unlimited number of videos)
- Default: `-1`

`ALWAYS_DOWNLOAD` - 1080p and below will always download to server instead of streaming

- Boolean (`0` or `1`)
- Default: `0`
- ⚠️ Setting to `1` will significantly increase storage and CPU usage

`MAXIMIZE_COMPATIBILITY` - Download and serve full video files instead of HLS streams / Maximizes compatibility with podcast apps

- Boolean (`0` or `1`)
- Default: `0`
- Not recommended when `MAX_QUALITY` is `1440` or `2160`
- Disables `ADAPTIVE_QUALITY`
- ⚠️ This will significantly increase storage and CPU usage

### cookies.txt (Optional)

If you want to download YouTube content that requires user authentication to download, you will need to add a cookies.txt file to your configuration. One reason for needing this is to download members-only videos. Note that the source of these videos (channel, user, or playlist) still must be either public or unlisted. For members-only videos, I recommend going to the channel's home page and scrolling down to find an auto-generated playlist titled "Members-only videos" which will contain all the videos posted for members of the channel.

To generate this file:

1. To get a cookies.txt file, download a browser extension (such as [this one](https://chrome.google.com/webstore/detail/open-cookiestxt/gdocmgbfkjnnpapoeobnolbbkoibbcif) for Chrome)
2. Log in to YouTube
3. With a YouTube tab open, open the cookies.txt extension and click the export/download button
4. Rename the downloaded file to `cookies.txt`
