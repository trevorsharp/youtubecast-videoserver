import fs from 'fs';
import express from 'express';
import { z } from 'zod';
import {
  addVideosToQueue,
  getCurrentDownload,
  getCurrentTranscode,
  getWaitingForDownloadCount,
  getWaitingForTranscodeCount,
} from './services/downloadService';
import { cleanupTempFiles } from './services/cleanupService';

const PORT = 80;
const CONTENT_DIRECTORY = '/content';

const app = express();
app.use(express.json());
app.use(CONTENT_DIRECTORY, express.static(`${CONTENT_DIRECTORY}/`));

let isTemporarilyDisabled = false;
let temporarilyDisableTimeout: NodeJS.Timeout | undefined;

app.get('/', async (_, res) => res.sendFile('/app/build/index.html'));

app.get('/status', async (_, res) => {
  const currentDownload = await getCurrentDownload();
  const currentTranscode = await getCurrentTranscode();
  const waitingForDownloadCount = getWaitingForDownloadCount();
  const waitingForTranscodeCount = getWaitingForTranscodeCount();

  const status =
    `Current Download - ${currentDownload ?? 'None'}\n` +
    `Current Transcode - ${currentTranscode ?? 'None'}\n` +
    `Watiting For Download - ${
      waitingForDownloadCount === 0
        ? 'No Videos'
        : waitingForDownloadCount === 1
        ? '1 Video'
        : `${waitingForDownloadCount} Videos`
    }\n` +
    `Watiting For Transcode - ${
      waitingForTranscodeCount === 0
        ? 'No Videos'
        : waitingForTranscodeCount === 1
        ? '1 Video'
        : `${waitingForTranscodeCount} Videos`
    }`;

  res.status(200).send(status);
});

app.post('/disable', async (_, res) => {
  isTemporarilyDisabled = true;
  if (temporarilyDisableTimeout) clearTimeout(temporarilyDisableTimeout);
  temporarilyDisableTimeout = setTimeout(() => (isTemporarilyDisabled = false), 5 * 60 * 1000);
  res.status(200).send(true);
});

app.post('/', async (req, res) => {
  try {
    const request = z.array(z.string().regex(/^[A-Z0-9_\-]{11}$/i)).safeParse(req.body);

    if (!request.success) return res.status(400).send();

    addVideosToQueue(request.data);

    res.status(200).send();
  } catch (error) {
    res.status(500).send(error);
  }
});

app.get('/:videoId', (req, res) => {
  try {
    const videoId = req.params.videoId;

    if (isTemporarilyDisabled) return res.status(404).send();

    const videoFilePath = `${CONTENT_DIRECTORY}/${videoId}.m3u8`;

    if (!fs.existsSync(videoFilePath)) return res.status(404).send();

    res.status(200).send(videoFilePath);
  } catch (error) {
    res.status(500).send(error);
  }
});

app.listen(PORT, () => console.log(`Listening on port ${PORT}`));
cleanupTempFiles();

export { CONTENT_DIRECTORY };
