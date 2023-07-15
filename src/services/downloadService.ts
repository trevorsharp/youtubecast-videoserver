import fs from 'fs';
import { z } from 'zod';
import { addVideoToKeep } from './cleanupService';
import { CONTENT_DIRECTORY } from '..';

const DOWNLOAD_DIRECTORY = '/download';

z.string()
  .regex(/^(2160|1440|1080|720|480|360).*$/)
  .transform((x) => parseInt(x.slice(0, 4)))
  .parse(process.env.VIDEO_QUALITY);

const VIDEOS_PER_FEED = z
  .preprocess((x) => parseInt(typeof x === 'string' ? x : ''), z.number().min(1))
  .parse(process.env.VIDEOS_PER_FEED);

const getStatus = async () => {
  const files = await fs.promises.readdir(DOWNLOAD_DIRECTORY);

  return {
    currentDownload: files.find((file) => file.endsWith('.download'))?.replace('.download', ''),
    currentTranscode: files.find((file) => file.endsWith('.transcode'))?.replace('.transcode', ''),
    waitingForDownloadCount: files.filter((file) => file.endsWith('.download.queue'))?.length ?? 0,
    waitingForTranscodeCount:
      files.filter((file) => file.endsWith('.transcode.queue'))?.length ?? 0,
  };
};

const addVideosToQueue = async (videoList: string[]) => {
  console.log(`Received Updated Video List: ${videoList.find(() => true)}`);

  const videosToDownload = videoList.slice(0, Math.min(videoList.length, VIDEOS_PER_FEED));

  const files = await fs.promises.readdir(DOWNLOAD_DIRECTORY);

  await Promise.all(
    videosToDownload.map(async (videoId) => {
      addVideoToKeep(videoId);

      const videoIsAlreadyAdded =
        !!files.find((file) => file.includes(`${videoId}.download`)) ||
        !!files.find((file) => file.includes(`${videoId}.transcode`)) ||
        !!(await fs.promises.stat(`${CONTENT_DIRECTORY}/${videoId}.m3u8`).catch(() => false));

      if (!videoIsAlreadyAdded) {
        await fs.promises.writeFile(`${videoId}.download.queue`, '');
        console.log(`Added Video To Download Queue: ${videoId}`);
      }
    })
  );

  console.log(`Processed Video List: ${videoList.find(() => true)}`);
};

export { addVideosToQueue, getStatus };
