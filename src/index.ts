import fs from 'fs';
import express from 'express';
import { z } from 'zod';
import { addVideosToQueue, ENABLE_DYNAMIC_QUALITY } from './services/downloadService';
import { cleanupTempFiles } from './services/cleanupService';

const PORT = 80;
const CONTENT_DIRECTORY = '/content';

const app = express();
app.use(express.json());
app.use(CONTENT_DIRECTORY, express.static(`${CONTENT_DIRECTORY}/`));

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

    if (ENABLE_DYNAMIC_QUALITY) {
      const dynamicVideoFilePath = `${CONTENT_DIRECTORY}/${videoId}.dynamic.m3u8`;
      if (fs.existsSync(dynamicVideoFilePath)) return res.status(200).send(dynamicVideoFilePath);
    }

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
