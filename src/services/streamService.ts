import { AudioFormat, VideoFormat } from '../types/Formats';

const buildStream = (
  videoFormats: VideoFormat[],
  audioFormat: AudioFormat,
  adaptiveQuality: boolean
) => {
  if (videoFormats.length === 0) throw 'Could not find any video streams';

  const videoStreams = adaptiveQuality ? videoFormats : [getBestQuality(videoFormats)];

  const localStream = videoStreams.find((stream) => stream.isLocal && stream.hasAudio);

  return `#EXTM3U\n#EXT-X-VERSION:3\n\n#EXT-X-MEDIA:TYPE=AUDIO,GROUP-ID="audio",NAME="Remote Audio",DEFAULT=YES,AUTOSELECT=YES,URI="${
    audioFormat.url
  }"${
    localStream
      ? `\n\n#EXT-X-MEDIA:TYPE=AUDIO,GROUP-ID="local",NAME="Local Audio",DEFAULT=YES,AUTOSELECT=YES,URI="${localStream.url}"`
      : ''
  }\n\n${videoStreams
    .filter((stream) => stream.codec.startsWith('avc'))
    .map(
      (stream) =>
        `#EXT-X-STREAM-INF:PROGRAM-ID=1,BANDWIDTH=${stream.bitrate},CODECS="${
          stream.codec
        }",RESOLUTION=${stream.resolution},AUDIO="${
          stream.url === localStream?.url ? 'local' : 'audio'
        }"\n${stream.url}`
    )
    .join('\n\n')}`;
};

const getBestQuality = (videoFormats: VideoFormat[]) =>
  videoFormats.reduce((prev, curr) => (prev.quality < curr.quality ? curr : prev));

export { buildStream };
