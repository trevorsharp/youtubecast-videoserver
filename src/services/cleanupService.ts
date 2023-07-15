import fs from 'fs';
import { z } from 'zod';
import { CONTENT_DIRECTORY } from '..';

const CLEANUP_INTERVAL = z
  .preprocess((x) => parseInt(typeof x === 'string' ? x : ''), z.number().min(1))
  .parse(process.env.CLEANUP_INTERVAL);

const videosToKeep: Set<string> = new Set<string>();
let lastUpdatedOn = new Date();

setTimeout(async () => {
  // If not updated in the last 4 hours, skip cleanup
  if (new Date().getTime() - lastUpdatedOn.getTime() > 14400000) return;

  console.log('Cleaning up any old video files');

  const files = await fs.promises.readdir(CONTENT_DIRECTORY);

  await Promise.all(
    files.map((file) => {
      const videoId = file.replace(/^([^.]+)\..*$/, '$1');
      return videosToKeep.has(videoId)
        ? Promise.resolve()
        : fs.promises.unlink(`${CONTENT_DIRECTORY}/${file}`);
    })
  );

  videosToKeep.clear();
}, CLEANUP_INTERVAL * 86400000);

const addVideoToKeep = (videoId: string) => {
  lastUpdatedOn = new Date();
  videosToKeep.add(videoId);
};

const cleanupTempFiles = async () => {
  console.log('Removing any temp files');
  const files = await fs.promises.readdir(CONTENT_DIRECTORY);

  await Promise.all(
    files
      .filter(
        (file) =>
          file.endsWith('.temp') || file.endsWith('.download') || file.endsWith('.transcode')
      )
      .map((file) => fs.promises.unlink(`${CONTENT_DIRECTORY}/${file}`))
  );
};

export { addVideoToKeep, cleanupTempFiles };
