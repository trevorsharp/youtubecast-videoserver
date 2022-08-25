import fs from 'fs';
import { z } from 'zod';
import { CONTENT_DIRECTORY } from '..';

const CLEANUP_INTERVAL = z
  .preprocess((x) => parseInt(typeof x === 'string' ? x : ''), z.number().min(1))
  .parse(process.env.CLEANUP_INTERVAL);

const videosToKeep: Set<string> = new Set<string>();
let lastUpdatedOn = new Date();

setTimeout(() => {
  // If not updated in the last 4 hours, skip cleanup
  if (new Date().getTime() - lastUpdatedOn.getTime() > 14400000) return;

  fs.readdir(CONTENT_DIRECTORY, (_, files) => {
    console.log('Cleaning up any old video files');
    console.log('Videos to keep count', videosToKeep.size);
    files.forEach((file) => {
      const videoId = file.replace(/^([^.]+)\..*$/, '$1');
      if (!videosToKeep.has(videoId)) {
        console.log('Would delete video', videoId);
        // fs.unlinkSync(`${CONTENT_DIRECTORY}/${file}`);
      }
    });
  });

  videosToKeep.clear();
}, CLEANUP_INTERVAL * 86400000);

const addVideoToKeep = (videoId: string) => {
  lastUpdatedOn = new Date();
  videosToKeep.add(videoId);
};

const cleanupTempFiles = () =>
  fs.readdir(CONTENT_DIRECTORY, (_, files) => {
    console.log('Removing any .temp files');
    files
      .filter((file) => file.endsWith('.temp'))
      .forEach((file) => fs.unlinkSync(`${CONTENT_DIRECTORY}/${file}`));
  });

export { addVideoToKeep, cleanupTempFiles };
