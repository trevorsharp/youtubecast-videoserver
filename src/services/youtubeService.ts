import { spawn } from 'child_process';
import { z } from 'zod';
import { getQuality, qualities } from '../types/Quality';
import { AudioFormat, VideoFormat } from '../types/Formats';

const videoInfoSchema = z.object({
  formats: z.array(
    z.object({
      url: z.string(),
      protocol: z.string(),
      ext: z.string(),
      width: z
        .number()
        .nullish()
        .transform((val) => val ?? 0),
      height: z
        .number()
        .nullish()
        .transform((val) => val ?? 0),
      acodec: z.string().optional().default('none'),
      vcodec: z.string().optional().default('none'),
      vbr: z
        .number()
        .nullish()
        .transform((val) => val ?? 0),
      abr: z
        .number()
        .nullish()
        .transform((val) => val ?? 0),
      format: z
        .string()
        .nullish()
        .transform((val) => val ?? ''),
    })
  ),
});

type VideoInfo = z.infer<typeof videoInfoSchema>;

const getStreamingFormats = (videoId: string) =>
  new Promise<readonly [AudioFormat, VideoFormat[]]>((resolve, reject) => {
    const ytdlp = spawn('yt-dlp', ['-j', `https://youtu.be/${videoId}`]);

    let result = '';

    ytdlp.stdout.on('data', (data) => {
      result += data.toString();
    });

    ytdlp.on('close', () => {
      if (!result) throw 'Error - yt-dlp did not provide a response';
      resolve(getFormats(videoInfoSchema.parse(JSON.parse(result))));
    });

    ytdlp.on('error', (err) => reject(err));
  });

const getFormats = (videoInfo: VideoInfo) => {
  videoInfo.formats = videoInfo.formats.filter(
    (format) => format.protocol.includes('m3u8') && format.ext === 'mp4'
  );

  return [getAudioFormat(videoInfo), getVideoFormats(videoInfo)] as const;
};

const getAudioFormat = (videoInfo: VideoInfo): AudioFormat => {
  const audioFormat = videoInfo.formats
    .sort((a, b) => b.abr - a.abr)
    .sort(
      (a, b) =>
        (b.format.toLowerCase().includes('original') ? 1 : 0) -
        (a.format.toLowerCase().includes('original') ? 1 : 0)
    )
    .find((format) => format.vcodec === 'none');

  if (!audioFormat) throw 'Could not find compatible audio format';

  return {
    url: audioFormat.url,
  };
};

const getVideoFormats = (videoInfo: VideoInfo): VideoFormat[] => {
  const filteredFormats = videoInfo.formats
    .sort((a, b) => b.vbr - a.vbr)
    .sort((a, b) => (b.vcodec.includes('avc') ? 1 : 0) - (a.vcodec.includes('avc') ? 1 : 0));

  const videoFormats: VideoFormat[] = [];

  qualities.forEach((quality) => {
    const videoFormatForQuality = filteredFormats.find(
      (format) => getQuality(format.width, format.height) === quality
    );

    if (videoFormatForQuality)
      videoFormats.push({
        isLocal: false,
        hasAudio: videoFormatForQuality.acodec !== 'none',
        quality,
        url: videoFormatForQuality.url,
        resolution: `${videoFormatForQuality.width}x${videoFormatForQuality.height}`,
        codec: videoFormatForQuality.vcodec,
        bitrate: Math.round((videoFormatForQuality.vbr ?? 0) * 1000),
      });
  });

  return videoFormats;
};

export { getStreamingFormats };
