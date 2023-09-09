import fs from 'fs';
import { Hono } from 'hono';
import { serveStatic } from 'hono/bun';
import { z } from 'zod';
import { addVideosToQueue, getStatus, reQueueUnfinishedVideos } from './services/downloadService';

const PORT = z
  .preprocess((x) => (typeof x === 'string' ? parseInt(x) : x), z.number())
  .parse(process.env.PORT ?? 80);

export const CONTENT_DIRECTORY = process.env.CONTENT_FOLDER ?? '/content';
fs.mkdirSync(CONTENT_DIRECTORY, { recursive: true });

let isTemporarilyDisabled = false;
let temporarilyDisableTimeout: NodeJS.Timeout | undefined;

const formatVideoCount = (count: number) =>
  count === 0 ? 'No Videos' : count === 1 ? '1 Video' : `${count} Videos`;

const app = new Hono();

app.use(
  '/content/*',
  serveStatic({
    root: `${CONTENT_DIRECTORY}`,
    rewriteRequestPath: (path) => path.replace('content/', ''),
  })
);

app.get('/', serveStatic({ path: './src/index.html' }));

app.get('/status', async (c) => {
  const { currentDownload, currentTranscode, waitingForDownloadCount, waitingForTranscodeCount } =
    await getStatus();

  const status =
    `Current Download:  ${currentDownload ?? 'None'}\n` +
    `${formatVideoCount(waitingForDownloadCount)} Waiting For Download\n\n` +
    `Current Transcode:  ${currentTranscode ?? 'None'}\n` +
    `${formatVideoCount(waitingForTranscodeCount)} Waiting For Transcode`;

  return c.text(status);
});

app.post('/disable', async (c) => {
  isTemporarilyDisabled = true;

  if (temporarilyDisableTimeout) clearTimeout(temporarilyDisableTimeout);

  temporarilyDisableTimeout = setTimeout(() => {
    isTemporarilyDisabled = false;
  }, 5 * 60 * 1000);

  return c.text('Disabled', 200);
});

app.post('/', async (c) => {
  try {
    const request = await c.req
      .json()
      .then((requestBody) =>
        z.array(z.string().regex(/^[A-Z0-9_\-]{11}$/i)).safeParse(requestBody)
      );
    if (!request.success) return c.text('Bad Request', 400);

    await addVideosToQueue(request.data);

    return c.text('Processed Video List');
  } catch (error) {
    return c.text(error as string, 500);
  }
});

app.get('/:videoId', async (c) => {
  try {
    const videoId = c.req.param('videoId');
    const videoFilePath = `${CONTENT_DIRECTORY}/${videoId}.m3u8`;

    const videoExists =
      !isTemporarilyDisabled && !!(await fs.promises.stat(videoFilePath).catch(() => false));

    if (!videoExists) return c.text('Video Not Found', 404);

    return c.text(`/content/${videoId}.m3u8`);
  } catch (error) {
    return c.text(error as string, 500);
  }
});

void reQueueUnfinishedVideos();

export default {
  fetch: app.fetch,
  port: PORT ?? 80,
};
