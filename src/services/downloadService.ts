import fs from 'fs';
import { z } from 'zod';
import { addVideoToKeep } from './cleanupService';
import { CONTENT_DIRECTORY } from '..';

const DOWNLOAD_DIRECTORY = process.env.DOWNLOAD_FOLDER ?? '/content';
fs.mkdirSync(DOWNLOAD_DIRECTORY, { recursive: true });

z.string()
  .regex(/^(2160|1440|1080|720|480|360).*$/)
  .default('1080')
  .transform((x) => parseInt(x.slice(0, 4)))
  .parse(process.env.VIDEO_QUALITY ?? '1080');

const VIDEOS_PER_FEED = z
  .preprocess((x) => parseInt(typeof x === 'string' ? x : ''), z.number().min(1))
  .parse(process.env.VIDEOS_PER_FEED ?? '3');

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
  console.log(`Received Video List (${videoList.find(() => true)})`);

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
        await fs.promises.writeFile(`${DOWNLOAD_DIRECTORY}/${videoId}.download.queue`, '');
        console.log(`Added New Video To Download Queue (${videoId})`);
      }
    })
  );

  console.log(`Finished Video List (${videoList.find(() => true)})`);
};

const reQueueUnfinishedVideos = async () => {
  const files = await fs.promises.readdir(DOWNLOAD_DIRECTORY);

  await Promise.all(
    files.map((file) =>
      file.endsWith('.download') || file.endsWith('.transcode')
        ? fs.promises.rename(`${DOWNLOAD_DIRECTORY}/${file}`, `${DOWNLOAD_DIRECTORY}/${file}.queue`)
        : Promise.resolve()
    )
  );
};

export { addVideosToQueue, getStatus, reQueueUnfinishedVideos };
