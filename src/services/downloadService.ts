import fs from 'fs';
import { z } from 'zod';
import { spawn } from 'child_process';
import { CONTENT_DIRECTORY } from '..';
import { addVideoToKeep } from './cleanupService';

const ENABLE_DYNAMIC_QUALITY = z
  .string()
  .regex(/^(0|1|true|false)$/i)
  .transform((x) => x.toLowerCase() === '1' || x.toLowerCase() === 'true')
  .parse(process.env.ENABLE_DYNAMIC_QUALITY ?? 'false');

const VIDEO_QUALITY = z
  .string()
  .regex(/^(2160|1440|1080|720|480|360).*$/)
  .transform((x) => parseInt(x.slice(0, 4)))
  .parse(process.env.VIDEO_QUALITY);

const VIDEOS_PER_FEED = z
  .preprocess((x) => parseInt(typeof x === 'string' ? x : ''), z.number().min(1))
  .parse(process.env.VIDEOS_PER_FEED);

const downloadQueue: string[] = [];

setInterval(
  () =>
    fs.readdir(CONTENT_DIRECTORY, (_, files) => {
      if (downloadQueue.length > 0) {
        if (files.filter((file) => file.endsWith('.temp')).length > 0) {
          console.log('Queue Waiting For Download To Finish ...');
          return;
        }
        downloadVideo(downloadQueue.shift()!);
      }
    }),
  60000
);

const downloadVideo = (videoId: string): void => {
  console.log(`Starting Download: ${videoId}`);
  const videoDownloadProcess = spawn('sh', [
    './downloadVideos.sh',
    CONTENT_DIRECTORY,
    videoId,
    `${VIDEO_QUALITY}`,
    ENABLE_DYNAMIC_QUALITY && VIDEO_QUALITY > 720 ? 'true' : 'false',
  ]);

  videoDownloadProcess.stdout.on('data', (data) => console.log(`${data}`));
  videoDownloadProcess.stderr.on('data', (error) => console.log(`${error}`));
  videoDownloadProcess.on('error', (error) => console.log(`Download Error: ${error.message}`));
  videoDownloadProcess.on('close', () =>
    console.log(`Finished Download: ${videoId} (Queue contains ${downloadQueue.length} videos)`)
  );
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
        `Added Video To Download Queue: ${videoId} (Queue contains ${downloadQueue.length} videos)`
      );
    }
  });

  console.log(`Processed Video List: ${videoList.find(() => true)}`);
};

export { addVideosToQueue, ENABLE_DYNAMIC_QUALITY };
