import fs from 'fs';
import express from 'express';
import { z } from 'zod';
import { addVideosToQueue, getStatus, reQueueUnfinishedVideos } from './services/downloadService';
import { getVideoLink } from './services/streamingService';

const PORT = 80;
const CONTENT_DIRECTORY = process.env.CONTENT_FOLDER ?? '/content';
fs.mkdirSync(CONTENT_DIRECTORY, { recursive: true });
const STREAMING_ONLY = process.env.STREAMING_ONLY?.toLowerCase() === 'true';

const app = express();
app.use(express.json());
app.use('/content', express.static(`${CONTENT_DIRECTORY}/`));

let isTemporarilyDisabled = false;
let temporarilyDisableTimeout: NodeJS.Timeout | undefined;

const formatVideoCount = (count: number) =>
  count === 0 ? 'No Videos' : count === 1 ? '1 Video' : `${count} Videos`;

app.get('/', async (_, res) => res.sendFile('/app/build/index.html'));

app.get('/status', async (_, res) => {
  const { currentDownload, currentTranscode, waitingForDownloadCount, waitingForTranscodeCount } =
    await getStatus();

  const status =
    `Current Download:  ${currentDownload ?? 'None'}\n` +
    `${formatVideoCount(waitingForDownloadCount)} Waiting For Download\n\n` +
    `Current Transcode:  ${currentTranscode ?? 'None'}\n` +
    `${formatVideoCount(waitingForTranscodeCount)} Waiting For Transcode`;

  res.status(200).send(status);
});

app.post('/disable', async (_, res) => {
  isTemporarilyDisabled = true;

  if (temporarilyDisableTimeout) clearTimeout(temporarilyDisableTimeout);

  temporarilyDisableTimeout = setTimeout(() => {
    isTemporarilyDisabled = false;
  }, 5 * 60 * 1000);

  res.status(200).send(true);
});

app.post('/', async (req, res) => {
  try {
    const request = z.array(z.string().regex(/^[A-Z0-9_\-]{11}$/i)).safeParse(req.body);
    if (!request.success) return res.status(400).send();

    if (!STREAMING_ONLY) await addVideosToQueue(request.data);

    res.status(200).send();
  } catch (error) {
    res.status(500).send(error);
  }
});

app.get('/:videoId', async (req, res) => {
  try {
    const videoId = req.params.videoId;
    const videoFilePath = `${CONTENT_DIRECTORY}/${videoId}.m3u8`;

    const videoExists =
      !isTemporarilyDisabled && !!(await fs.promises.stat(videoFilePath).catch(() => false));

    if (!videoExists) {
      const streamingLink = await getVideoLink(videoId);

      if (!streamingLink) return res.status(404).send('Video Not Found');

      return res.status(200).send(streamingLink);
    }

    res.status(200).send(`/content/${videoId}.m3u8`);
  } catch (error) {
    res.status(500).send(error);
  }
});

app.listen(PORT, () => console.log(`Listening on port ${PORT}`));
void reQueueUnfinishedVideos();

export { CONTENT_DIRECTORY };
