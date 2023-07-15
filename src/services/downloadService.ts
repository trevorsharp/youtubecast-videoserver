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

let currentDownload: string | undefined;
let currentTranscode: string | undefined;
const downloadQueue: string[] = [];
const transcodeQueue: string[] = [];

const getCurrentDownload = () => currentDownload;
const getCurrentTranscode = () => currentTranscode;
const getWaitingForDownloadCount = () => downloadQueue.length;
const getWaitingForTranscodeCount = () => transcodeQueue.length;

setInterval(async () => {
  if (currentDownload) {
    const isDownloading = !!(await fs.promises
      .stat(`${DOWNLOAD_DIRECTORY}/${currentDownload}.download`)
      .catch(() => false));

    if (!isDownloading) {
      transcodeQueue.push(currentDownload);
      currentDownload = undefined;
    }
  }

  if (downloadQueue.length > 0 && !currentDownload) {
    currentDownload = downloadQueue.shift();
    await fs.promises.writeFile(`${DOWNLOAD_DIRECTORY}/${currentDownload}.download`, '');
    console.log(`Downloading Video: ${currentDownload}`);
  }

  if (currentTranscode) {
    const isTranscoding = !!(await fs.promises
      .stat(`${DOWNLOAD_DIRECTORY}/${currentTranscode}.transcode`)
      .catch(() => false));

    if (!isTranscoding) currentTranscode = undefined;
  }

  if (transcodeQueue.length > 0 && !currentTranscode) {
    currentTranscode = transcodeQueue.shift();
    await fs.promises.writeFile(`${DOWNLOAD_DIRECTORY}/${currentTranscode}.transcode`, '');
    console.log(`Transcoding Video: ${currentTranscode}`);
  }
}, 30000);

const addVideosToQueue = async (videoList: string[]) => {
  console.log(`Received Updated Video List: ${videoList.find(() => true)}`);

  const videosToDownload = videoList.slice(0, Math.min(videoList.length, VIDEOS_PER_FEED));

  await Promise.all(
    videosToDownload.map(async (videoId) => {
      addVideoToKeep(videoId);

      const videoIsAlreadyAdded =
        downloadQueue.includes(videoId) ||
        transcodeQueue.includes(videoId) ||
        currentDownload === videoId ||
        currentTranscode === videoId ||
        !!(await fs.promises.stat(`${CONTENT_DIRECTORY}/${videoId}.m3u8`).catch(() => false));

      if (!videoIsAlreadyAdded) {
        downloadQueue.push(videoId);
        console.log(`Added Video To Download Queue: ${videoId}`);
      }
    })
  );

  console.log(`Processed Video List: ${videoList.find(() => true)}`);
};

export {
  addVideosToQueue,
  getCurrentDownload,
  getCurrentTranscode,
  getWaitingForDownloadCount,
  getWaitingForTranscodeCount,
};
