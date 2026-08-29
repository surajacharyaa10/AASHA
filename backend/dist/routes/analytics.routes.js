"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const analytics_controller_1 = require("../controllers/analytics.controller");
const router = (0, express_1.Router)();
// GET /api/analytics/summary
router.get('/summary', analytics_controller_1.getAnalyticsSummary);
exports.default = router;
