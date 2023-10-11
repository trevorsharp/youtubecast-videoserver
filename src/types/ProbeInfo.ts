import { z } from 'zod';

const probeInfoSchema = z.object({
  format: z.object({
    bit_rate: z.string(),
  }),
  streams: z.array(
    z.object({
      codec_name: z.string(),
      width: z.number(),
      height: z.number(),
    })
  ),
});

type ProbeInfo = z.infer<typeof probeInfoSchema>;

export { probeInfoSchema, type ProbeInfo };
