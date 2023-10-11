import fs from 'fs';
import { spawn } from 'child_process';
import { ProbeInfo, probeInfoSchema } from '../types/ProbeInfo';
import { VideoFormat } from '../types/Formats';
import { getQuality } from '../types/Quality';
import { CONTENT_DIRECTORY } from '..';

const getLocalFormats = async (videoId: string): Promise<VideoFormat[]> => {
  const content = (await fs.promises.readdir(CONTENT_DIRECTORY)).filter((filename) =>
    filename.includes(videoId)
  );

  const videoFile = content.find((file) => file.includes('.ts'));
  const playlistFile = content.find((file) => file.includes('.m3u8'));

  if (!videoFile || !playlistFile) return [];

  const fileInfo = await probeVideoFile(videoFile);

  const stream = fileInfo.streams.find((x) => true);

  const height = stream?.height ?? 0;
  const width = stream?.width ?? 0;

  return [
    {
      isLocal: true,
      hasAudio: true,
      quality: getQuality(width, height),
      resolution: `${width}x${height}`,
      url: `/content/${playlistFile}`,
      codec: 'avc1.640029',
      bitrate: parseInt(fileInfo.format.bit_rate),
    },
  ];
};

const probeVideoFile = async (filename: string) =>
  new Promise<ProbeInfo>((resolve, reject) => {
    const ffprobe = spawn('ffprobe', [
      '-i',
      `${CONTENT_DIRECTORY}/${filename}`,
      '-v',
      'quiet',
      '-select_streams',
      'v',
      '-print_format',
      'json',
      '-show_entries',
      'format=bit_rate:stream=codec_name,width,height',
    ]);
    let result = '';
    ffprobe.stdout.on('data', (data) => {
      result += data.toString();
    });
    ffprobe.on('close', () => resolve(probeInfoSchema.parse(JSON.parse(result))));
    ffprobe.on('error', (err) => reject(err));
  });

export { getLocalFormats };
