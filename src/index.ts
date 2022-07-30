import fs from 'fs';
import { spawn } from 'child_process';
import express from 'express';
import { z } from 'zod';

const PORT = 80;
const CONTENT_DIRECTORY = '/content';
const VIDEO_QUALITY = z
  .string()
  .regex(/^(2160|1440|1080).*$/)
  .transform((x) => parseInt(x.slice(0, 4)))
  .parse(process.env.VIDEO_QUALITY);

const downloadQueue: string[] = [];

const downloadVideo = (videoId: string): void => {
  console.log(`[downloader] Starting Download: ${videoId}`);
  const videoDownloadProcess = spawn('sh', [
    './downloadVideos.sh',
    CONTENT_DIRECTORY,
    videoId,
    `${VIDEO_QUALITY}`,
  ]);

  videoDownloadProcess.stdout.on('data', (data) => console.log(`[downloader] ${data}`));
  videoDownloadProcess.stderr.on('data', (error) => console.log(`[downloader] ${error}`));
  videoDownloadProcess.on('error', (error) =>
    console.log(`[downloader] Download Error: ${error.message}`)
  );
  videoDownloadProcess.on('close', () =>
    console.log(
      `[downloader] Finished Download: ${videoId} (Queue contains ${downloadQueue.length} videos)`
    )
  );
};

const queueProcessor = () =>
  fs.readdir(CONTENT_DIRECTORY, (_, files) => {
    if (downloadQueue.length > 0) {
      if (files.filter((file) => file.endsWith('.temp')).length > 0) {
        console.log('[downloader] Queue Waiting For Download To Finish ...');
        return;
      }
      downloadVideo(downloadQueue.shift()!);
    }
  });

setInterval(() => queueProcessor(), 60000);

const queueVideos = (videoList: string[]): void => {
  console.log(`[processor] Received Updated Video List: ${videoList.find(() => true)}`);

  videoList.slice(0, Math.min(videoList.length, 2)).forEach((videoId) => {
    if (
      !fs.existsSync(`${CONTENT_DIRECTORY}/${videoId}.m3u8`) &&
      !fs.existsSync(`${CONTENT_DIRECTORY}/${videoId}.temp`) &&
      !downloadQueue.find((x) => x === videoId)
    ) {
      downloadQueue.push(videoId);
      console.log(
        `[processor] Added Video To Download Queue: ${videoId} (Queue contains ${downloadQueue.length} videos)`
      );
    }
  });

  console.log(`[processor] Processed Video List: ${videoList.find(() => true)}`);
};

const app = express();
app.use(express.json());
app.use(CONTENT_DIRECTORY, express.static(`${CONTENT_DIRECTORY}/`));

app.post('/', async (req, res) => {
  try {
    const request = z.array(z.string().regex(/^[A-Z0-9_\-]{11}$/i)).safeParse(req.body);

    if (!request.success) return res.status(400).send();

    queueVideos(request.data);

    res.status(200).send();
  } catch (error) {
    res.status(500).send(error);
  }
});

app.get('/:videoId', (req, res) => {
  try {
    const videoId = req.params.videoId;

    const videoFilePath = `${CONTENT_DIRECTORY}/${videoId}.m3u8`;

    if (!fs.existsSync(videoFilePath)) return res.status(404).send();

    res.status(200).send(videoFilePath);
  } catch (error) {
    res.status(500).send(error);
  }
});

app.listen(PORT, () => console.log(`Listening on port ${PORT}`));

fs.readdir(CONTENT_DIRECTORY, (_, files) => {
  console.log('Removing any leftover .temp files');
  files
    .filter((file) => file.endsWith('.temp'))
    .forEach((file) => fs.unlinkSync(`${CONTENT_DIRECTORY}/${file}`));
});
