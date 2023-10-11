import { AudioFormat, VideoFormat } from '../types/Formats';

const buildStream = (
  videoFormats: VideoFormat[],
  audioFormat: AudioFormat,
  adaptiveQuality: boolean
) => {
  if (videoFormats.length === 0) throw 'Could not find any video streams';

  const videoStreams = adaptiveQuality ? videoFormats : [getBestQuality(videoFormats)];

  const remoteAudioStream = audioFormat;
  const localAudioStream = videoStreams
    .filter((format) => format.isLocal && format.hasAudio)
    .map((format) => ({ url: format.url }))
    .find((_) => true);

  const audioStream = !adaptiveQuality && localAudioStream ? localAudioStream : remoteAudioStream;

  if (!audioStream) throw 'Could not find audio stream';

  return `#EXTM3U\n#EXT-X-VERSION:3\n\n#EXT-X-MEDIA:TYPE=AUDIO,GROUP-ID="audio",NAME="audio",DEFAULT=YES,AUTOSELECT=YES,URI="${
    audioStream.url
  }"\n\n${videoStreams
    .map(
      (stream) =>
        `#EXT-X-STREAM-INF:PROGRAM-ID=1,BANDWIDTH=${stream.bitrate},CODECS="${stream.codec}",RESOLUTION=${stream.resolution},AUDIO="audio"\n${stream.url}`
    )
    .join('\n\n')}`;
};

const getBestQuality = (videoFormats: VideoFormat[]) =>
  videoFormats.reduce((prev, curr) => (prev.quality < curr.quality ? curr : prev));

export { buildStream };
