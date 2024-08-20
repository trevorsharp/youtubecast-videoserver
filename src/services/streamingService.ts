import { execSync } from 'child_process';
import fs from 'fs';

const getVideoLink = (videoId: string) => {
  if (!videoId.match(/^[a-z0-9_-]{11}$/i)) return undefined;

  try {
    console.log(`Getting video streaming link for ${videoId}`);
    const url = execSync(
      `yt-dlp -g --format=best[vcodec^=avc1] ${
        fs.existsSync('/app/cookies.txt') ? `--cookies="/app/cookies.txt"` : ''
      } http://www.youtube.com/watch?v=${videoId}`
    ).toString();

    return url;
  } catch (error: any) {
    console.error(error);
    return undefined;
  }
};

export { getVideoLink };
