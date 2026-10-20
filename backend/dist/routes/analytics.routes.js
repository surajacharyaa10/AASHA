"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const analytics_controller_1 = require("../controllers/analytics.controller");
const analytics_controller_2 = require("../controllers/analytics.controller");
const router = (0, express_1.Router)();
// GET /api/analytics/summary
router.get('/summary', analytics_controller_1.getAnalyticsSummary);
// GET /api/analytics/sos-by-area
router.get('/sos-by-area', analytics_controller_2.getSosByArea);
exports.default = router;
