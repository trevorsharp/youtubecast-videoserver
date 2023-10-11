const qualities = [360, 480, 720, 1080, 1440, 2160] as const;

type Quality = typeof qualities[number];

const getQuality = (width: number, height: number) =>
  qualities.find((quality) => Math.min(width, height) <= quality) ?? qualities[0];

export { qualities, getQuality, type Quality };
