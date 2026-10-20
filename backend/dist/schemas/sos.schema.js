"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.resolveEventSchema = exports.assignTeamSchema = exports.createSosSchema = void 0;
const zod_1 = require("zod");
exports.createSosSchema = zod_1.z.object({
    packetId: zod_1.z.string().uuid(),
    originDeviceId: zod_1.z.string().length(16),
    latitude: zod_1.z.number().min(-90).max(90),
    longitude: zod_1.z.number().min(-180).max(180),
    battery: zod_1.z.number().int().min(0).max(100).optional(),
    hopCount: zod_1.z.number().int().min(0).optional(),
    reportedAt: zod_1.z.string().datetime(),
    note: zod_1.z.string().max(500).optional(),
    name: zod_1.z.string().optional(),
    address: zod_1.z.string().optional(),
    email: zod_1.z.string().optional(),
    phone: zod_1.z.string().optional(),
    bloodGroup: zod_1.z.string().optional(),
}).passthrough();
exports.assignTeamSchema = zod_1.z.object({
    teamId: zod_1.z.string().uuid()
});
exports.resolveEventSchema = zod_1.z.object({
    resolution: zod_1.z.enum(['resolved', 'false_alarm'])
});
