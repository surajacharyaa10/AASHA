"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const dispatch_controller_1 = require("../controllers/dispatch.controller");
const router = (0, express_1.Router)();
// GET /api/dispatch/nearest?lat=27.69&lng=86.73
router.get('/nearest', dispatch_controller_1.getNearestTeam);
// POST /api/dispatch  — full dispatch: find team + update SOS + send emails
router.post('/', dispatch_controller_1.dispatchRescueTeam);
exports.default = router;
