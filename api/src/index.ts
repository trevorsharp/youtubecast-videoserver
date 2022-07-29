import fs from 'fs';
import { spawn } from 'child_process';
import express from 'express';
import { z } from 'zod';

const MAX_DOWNLOADS_PER_FEED = z
  .string()
  .regex(/^[0-9]+$/)
  .transform((x) => parseInt(x))
  .parse(process.env.MAX_DOWNLOADS_PER_FEED);

const VIDEO_QUALITY = z
  .string()
  .regex(/^(2160|1440|1080).*$/)
  .transform((x) => parseInt(x.slice(0, 4)))
  .parse(process.env.VIDEO_QUALITY);

const downloadVideos = (feedId: string, videoList: string[]): void => {
  console.log(`Received Feed: ${feedId}`);

  videoList.slice(0, Math.min(videoList.length, MAX_DOWNLOADS_PER_FEED)).forEach((videoId) => {
    if (
      !fs.existsSync(`/content/${feedId}/${videoId}.mp4`) &&
      !fs.existsSync(`/content/${feedId}/${videoId}.temp.mp4`)
    ) {
      console.log(`Starting Download: ${videoId}`);

      const videoDownloadProcess = spawn('sh', [
        './downloadVideos.sh',
        `/content/${feedId}`,
        videoId,
        `${VIDEO_QUALITY}`,
      ]);

      videoDownloadProcess.stdout.on('data', (data) => process.stdout.write(data));
      videoDownloadProcess.stderr.on('data', (data) => process.stdout.write(data));
      videoDownloadProcess.on('error', (error) => console.log(`Download Error: ${error.message}`));
      videoDownloadProcess.on('close', () => console.log(`Finished Download: ${videoId}`));
    }
  });
};

const app = express();
app.use(express.json());
const port = 80;

app.post('/', async (req, res) => {
  try {
    const request = z
      .object({
        feedId: z.string().regex(/^[A-Z0-9_\-]{0,30}$/i),
        videoIds: z.array(z.string().regex(/^[A-Z0-9_\-]{11}$/i)),
      })
      .safeParse(req.body);

    if (!request.success) return res.status(400).send();

    downloadVideos(request.data.feedId, request.data.videoIds);

    res.status(200).send();
  } catch (error) {
    res.status(500).send(error);
  }
});

app.get('/:feedId/:videoId', (req, res) => {
  try {
    const feedId = req.params.feedId;
    const videoId = req.params.videoId;

    console.log(feedId, videoId);

    const videoFilePath = `/content/${feedId}/${videoId}.mp4`;

    if (!fs.existsSync(videoFilePath)) return res.status(404).send();

    res.status(200).send(videoFilePath);
  } catch (error) {
    res.status(500).send(error);
  }
});

app.listen(port, () => console.log(`Listening on port ${port}`));
