# YouTubeCast Video Server

Unfortunately, YouTube has started blocking suspected bot traffic, which prevents YouTubeCast from streaming videos. YouTubeCast Video Server will allow you to continue to use YouTubeCast by setting up your own server to provide video links.

⚠️ WARNING - This will involve some technical knowledge and is not recommended for most users. Unfortunately, if you are not able to set up a video server for your use, you should seek an alternative to YouTubeCast.

## How to set up YouTubeCast Video Server

Prerequisites:

- You will need a machine that is capabile of running [Docker](https://docs.docker.com/get-started/docker-overview/) and has a port that is always accessible to the internet
- Ensure Docker is set up and running on your machine (https://docs.docker.com/get-docker)
- Set up a hostname that can be used to access your machine from the internet (can use a static IP address as well)

To run this application using Docker:

1. Create the `docker-compose.yml` file as described below
2. Run `docker-compose up -d` in the folder where your `docker-compose.yml` lives
3. Check the logs using `docker-compose logs -f` to see if there are any errors in your configuration
4. Add `?videoServer=example.com` to the end of your YouTubeCast feed url (replace `example.com` with your hostname)
5. Go to `https://youtubecast.com?setVideoServer=example.com` to save your video server's address in your browser's cookies. All feeds generated from that browser will automatically append `?videoServer=example.com` to your feed URLs (replace `example.com` with your hostname)

### docker-compose.yml

```
services:
  youtubecast-videoserver:
    image: trevorsharp/youtubecast-videoserver:latest
    container_name: youtubecast-videoserver
    restart: unless-stopped
    ports:
      - 80:80
    environment:
      - STREAMING_ONLY=true
```

1. Create a file named `docker-compose.yml` with the contents above
2. Leave the STREAMING_ONLY environment variable to true. This will prevent the video server from downloading videos. If you do want videos to be downloaded to the video server, see the README of this project for additional details.
