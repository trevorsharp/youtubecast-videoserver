import fs from 'fs';
import { spawn } from 'child_process';
import express from 'express';
import { z } from 'zod';

const VIDEO_QUALITY = z
  .string()
  .regex(/^(2160|1440|1080).*$/)
  .transform((x) => parseInt(x.slice(0, 4)))
  .parse(process.env.VIDEO_QUALITY);

const downloadVideos = (videoList: string[]): void => {
  console.log(`Received New Video List`);

  videoList.slice(0, Math.min(videoList.length, 2)).forEach((videoId) => {
    if (
      !fs.existsSync(`/content/${videoId}.mp4`) &&
      !fs.existsSync(`/content/${videoId}.temp.mp4`)
    ) {
      console.log(`Starting Download: ${videoId}`);

      const videoDownloadProcess = spawn('sh', [
        './downloadVideos.sh',
        `/content`,
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
    const request = z.array(z.string().regex(/^[A-Z0-9_\-]{11}$/i)).safeParse(req.body);

    if (!request.success) return res.status(400).send();

    downloadVideos(request.data);

    res.status(200).send();
  } catch (error) {
    res.status(500).send(error);
  }
});

app.get('/:videoId', (req, res) => {
  try {
    const videoId = req.params.videoId;

    const videoFilePath = `/content/${videoId}.mp4`;

    if (!fs.existsSync(videoFilePath)) return res.status(404).send();

    res.status(200).send(videoFilePath);
  } catch (error) {
    res.status(500).send(error);
  }
});

app.listen(port, () => console.log(`Listening on port ${port}`));
