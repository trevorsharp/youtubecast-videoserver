import { AudioFormat, VideoFormat } from '../types/Formats';

const buildStream = (
  videoFormats: VideoFormat[],
  audioFormat: AudioFormat,
  adaptiveQuality: boolean
) => {
  if (videoFormats.length === 0) throw 'Could not find any video streams';

  const videoStreams = adaptiveQuality ? videoFormats : [getBestQuality(videoFormats)];

  return `#EXTM3U\n#EXT-X-VERSION:3\n\n#EXT-X-MEDIA:TYPE=AUDIO,GROUP-ID="audio",NAME="audio",DEFAULT=YES,AUTOSELECT=YES,URI="${
    audioFormat.url
  }"\n\n${videoStreams
    .map(
      (stream) =>
        `#EXT-X-STREAM-INF:PROGRAM-ID=1,BANDWIDTH=${stream.bitrate},CODECS="${
          stream.codec
        }",RESOLUTION=${stream.resolution}${stream.hasAudio ? '' : ',AUDIO="audio"'}\n${stream.url}`
    )
    .join('\n\n')}`;
};

const getBestQuality = (videoFormats: VideoFormat[]) =>
  videoFormats.reduce((prev, curr) => (prev.quality < curr.quality ? curr : prev));

export { buildStream };
