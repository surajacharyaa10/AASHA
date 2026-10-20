"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const sos_controller_1 = require("../controllers/sos.controller");
const sosAction_controller_1 = require("../controllers/sosAction.controller");
const validate_1 = require("../middleware/validate");
const sos_schema_1 = require("../schemas/sos.schema");
const router = express_1.default.Router();
// One-click action link from dispatch emails (no auth — protected by HMAC token in query)
router.get('/action', sosAction_controller_1.handleEmailAction);
router.post('/', (0, validate_1.validate)(sos_schema_1.createSosSchema), sos_controller_1.createSosEvent);
router.get('/', sos_controller_1.getSosEvents);
router.get('/:id', sos_controller_1.getSosEvent);
router.patch('/:id/assign', (0, validate_1.validate)(sos_schema_1.assignTeamSchema), sos_controller_1.assignTeam);
router.patch('/:id/resolve', (0, validate_1.validate)(sos_schema_1.resolveEventSchema), sos_controller_1.resolveEvent);
exports.default = router;
