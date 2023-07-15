import fs from 'fs';
import { z } from 'zod';
import { spawn } from 'child_process';
import { CONTENT_DIRECTORY } from '..';
import { addVideoToKeep } from './cleanupService';

const VIDEO_QUALITY = z
  .string()
  .regex(/^(2160|1440|1080|720|480|360).*$/)
  .transform((x) => parseInt(x.slice(0, 4)))
  .parse(process.env.VIDEO_QUALITY);

const VIDEOS_PER_FEED = z
  .preprocess((x) => parseInt(typeof x === 'string' ? x : ''), z.number().min(1))
  .parse(process.env.VIDEOS_PER_FEED);

const EXTERNAL_TRANSCODER = z
  .preprocess((x) => x === 'true' || x === '1', z.boolean().optional())
  .parse(process.env.EXTERNAL_TRANSCODER);

const downloadQueue: string[] = [];
const transcodeQueue: string[] = [];

const getCurrentDownload = () =>
  fs.promises
    .readdir(CONTENT_DIRECTORY)
    .then((files) => files.find((file) => file.endsWith('.download'))?.replace('.download', ''));

const getCurrentTranscode = () =>
  fs.promises
    .readdir(CONTENT_DIRECTORY)
    .then((files) => files.find((file) => file.endsWith('.transcode'))?.replace('.transcode', ''));

const getWaitingForDownloadCount = () => downloadQueue.length;
const getWaitingForTranscodeCount = () => transcodeQueue.length;

setInterval(() => {
  if (downloadQueue.length > 0 && !getCurrentDownload()) downloadVideo(downloadQueue.shift()!);
  if (transcodeQueue.length > 0 && !getCurrentTranscode()) transcodeVideo(transcodeQueue.shift()!);
}, 60000);

const downloadVideo = (videoId: string): void => {
  console.log(`Starting Download: ${videoId}`);

  const videoDownloadProcess = spawn('sh', [
    './downloadVideo.sh',
    CONTENT_DIRECTORY,
    videoId,
    `${VIDEO_QUALITY}`,
  ]);

  videoDownloadProcess.stdout.on('data', (data) => console.log(`${data}`));
  videoDownloadProcess.stderr.on('data', (error) => console.log(`${error}`));
  videoDownloadProcess.on('error', (error) => console.log(`Download Error: ${error.message}`));
  videoDownloadProcess.on('close', () => {
    console.log(
      `Finished Download: ${videoId} (Downlaod queue contains ${downloadQueue.length} videos)`
    );
    transcodeQueue.push(videoId);
  });
};

const transcodeVideo = (videoId: string): void => {
  console.log(`Starting Transcode: ${videoId}`);

  fs.writeFileSync(`${CONTENT_DIRECTORY}/${videoId}.transcode`, '');

  if (!EXTERNAL_TRANSCODER) {
    const videoDownloadProcess = spawn('sh', ['./transcodeVideos.sh', CONTENT_DIRECTORY]);

    videoDownloadProcess.stdout.on('data', (data) => console.log(`${data}`));
    videoDownloadProcess.stderr.on('data', (error) => console.log(`${error}`));
    videoDownloadProcess.on('error', (error) => console.log(`Transcode Error: ${error.message}`));
    videoDownloadProcess.on('close', () =>
      console.log(
        `Finished Transcode: ${videoId} (Transcode queue contains ${transcodeQueue.length} videos)`
      )
    );
  }
};

const addVideosToQueue = (videoList: string[]): void => {
  console.log(`Received Updated Video List: ${videoList.find(() => true)}`);

  videoList.slice(0, Math.min(videoList.length, VIDEOS_PER_FEED)).forEach((videoId) => {
    addVideoToKeep(videoId);

    if (
      !fs.existsSync(`${CONTENT_DIRECTORY}/${videoId}.m3u8`) &&
      !fs.existsSync(`${CONTENT_DIRECTORY}/${videoId}.temp`) &&
      !downloadQueue.find((x) => x === videoId)
    ) {
      downloadQueue.push(videoId);
      console.log(
        `Added Video To Download Queue: ${videoId} (Download queue contains ${downloadQueue.length} videos)`
      );
    }
  });

  console.log(`Processed Video List: ${videoList.find(() => true)}`);
};

export {
  addVideosToQueue,
  getCurrentDownload,
  getCurrentTranscode,
  getWaitingForDownloadCount,
  getWaitingForTranscodeCount,
};
