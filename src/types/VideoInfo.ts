import { z } from 'zod';

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
    })
  ),
});

type VideoInfo = z.infer<typeof videoInfoSchema>;

export { videoInfoSchema, type VideoInfo };
