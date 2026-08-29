import { z } from 'zod';

export const createSosSchema = z.object({
  packetId: z.string().uuid(),
  originDeviceId: z.string().length(16),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  battery: z.number().int().min(0).max(100).optional(),
  hopCount: z.number().int().min(0).optional(),
  reportedAt: z.string().datetime(),
  note: z.string().max(500).optional(),
}).passthrough();

export const assignTeamSchema = z.object({
  teamId: z.string().uuid()
});

export const resolveEventSchema = z.object({
  resolution: z.enum(['resolved', 'false_alarm'])
});

export type CreateSosInput = z.infer<typeof createSosSchema>;
export type AssignTeamInput = z.infer<typeof assignTeamSchema>;
export type ResolveEventInput = z.infer<typeof resolveEventSchema>;