import fs from 'fs';
import { z } from 'zod';
import { CONTENT_DIRECTORY } from '..';

const CLEANUP_INTERVAL = z
  .preprocess((x) => parseInt(typeof x === 'string' ? x : ''), z.number().min(1))
  .parse(process.env.CLEANUP_INTERVAL);

let cleanupInterval: NodeJS.Timeout | undefined = undefined;
const videosToKeep: Set<string> = new Set<string>();

const cleanupVideos = (): void => {
  fs.readdir(CONTENT_DIRECTORY, (_, files) => {
    console.log('Cleaning up any old video files');
    files.forEach((file) => {
      const videoId = file.replace(/^([^.]+)\..*$/, '$1');
      if (!videosToKeep.has(videoId)) fs.unlinkSync(`${CONTENT_DIRECTORY}/${file}`);
    });
  });

  videosToKeep.clear();
  cleanupInterval = undefined;
};

const addVideoToKeep = (videoId: string) => {
  if (!cleanupInterval) cleanupInterval = setTimeout(cleanupVideos, CLEANUP_INTERVAL * 86400000);
  videosToKeep.add(videoId);
};

export { addVideoToKeep };
