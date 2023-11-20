import fs from 'fs';
import { z } from 'zod';
import { CONTENT_DIRECTORY } from '..';

const CLEANUP_INTERVAL = z
  .preprocess((x) => parseInt(typeof x === 'string' ? x : ''), z.number().min(0).max(14))
  .parse(process.env.CLEANUP_INTERVAL);

const videosToKeep: Set<string> = new Set<string>();
let lastUpdatedOn = new Date();

if (CLEANUP_INTERVAL > 0) {
  setTimeout(async () => {
    // If not updated in the last 4 hours, skip cleanup
    if (new Date().getTime() - lastUpdatedOn.getTime() > 14400000) return;

    console.log('Cleaning Up Video Files');

    const files = await fs.promises.readdir(CONTENT_DIRECTORY);

    await Promise.all(
      files.map((file) => {
        const videoId = file.replace(/^([^.]+)\..*$/, '$1');
        return videosToKeep.has(videoId)
          ? Promise.resolve()
          : fs.promises.unlink(`${CONTENT_DIRECTORY}/${file}`);
      }),
    );

    videosToKeep.clear();
  }, CLEANUP_INTERVAL * 86400000);
}

const addVideoToKeep = (videoId: string) => {
  lastUpdatedOn = new Date();
  videosToKeep.add(videoId);
};

export { addVideoToKeep };
