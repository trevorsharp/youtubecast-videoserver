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

setInterval(async () => {
  if (downloadQueue.length > 0) {
    if (await getCurrentDownload()) {
      console.log(
        `Waiting For Download To Finish (Download queue contains ${downloadQueue.length} videos)`
      );
    } else {
      downloadVideo(downloadQueue.shift()!);
    }
  }

  if (transcodeQueue.length > 0) {
    if (await getCurrentTranscode()) {
      console.log(
        `Waiting For Transcode To Finish (Transcode queue contains ${transcodeQueue.length} videos)`
      );
    } else {
      await transcodeVideo(transcodeQueue.shift()!);
    }
  }
}, 30000);

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
      `Finished Download: ${videoId} (Download queue contains ${downloadQueue.length} videos)`
    );
    transcodeQueue.push(videoId);
  });
};

const transcodeVideo = async (videoId: string) => {
  console.log(`Starting Transcode: ${videoId}`);

  await fs.promises.writeFile(`${CONTENT_DIRECTORY}/${videoId}.transcode`, '');

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

const addVideosToQueue = async (videoList: string[]) => {
  console.log(`Received Updated Video List: ${videoList.find(() => true)}`);

  const videosToDownload = videoList.slice(0, Math.min(videoList.length, VIDEOS_PER_FEED));

  await Promise.all(
    videosToDownload.map(async (videoId) => {
      addVideoToKeep(videoId);

      const videoIsAlreadyAdded =
        !!downloadQueue.find((v) => v === videoId) ||
        !!transcodeQueue.find((v) => v === videoId) ||
        !!(await fs.promises.stat(`${CONTENT_DIRECTORY}/${videoId}.m3u8`).catch(() => false)) ||
        !!(await fs.promises.stat(`${CONTENT_DIRECTORY}/${videoId}.download`).catch(() => false)) ||
        !!(await fs.promises.stat(`${CONTENT_DIRECTORY}/${videoId}.transcode`).catch(() => false));

      if (!videoIsAlreadyAdded) {
        downloadQueue.push(videoId);
        console.log(
          `Added Video To Download Queue: ${videoId} (Download queue contains ${downloadQueue.length} videos)`
        );
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
