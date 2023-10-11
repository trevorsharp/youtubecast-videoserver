import { Quality } from './Quality';

type VideoFormat = {
  url: string;
  isLocal: boolean;
  hasAudio: boolean;
  quality: Quality;
  resolution: `${number}x${number}`;
  codec: string;
  bitrate: number;
};

type AudioFormat = {
  url: string;
};

export { type VideoFormat, type AudioFormat };
