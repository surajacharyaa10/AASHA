"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const multer_1 = __importDefault(require("multer"));
const teamRegistration_controller_1 = require("../controllers/teamRegistration.controller");
const router = (0, express_1.Router)();
const storage = multer_1.default.memoryStorage();
const upload = (0, multer_1.default)({
    storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit for documents
});
// Routes
router.post('/', teamRegistration_controller_1.registerRescueTeam);
router.get('/', teamRegistration_controller_1.getTeamRegistrations);
router.post('/upload-doc', upload.single('document'), teamRegistration_controller_1.uploadRegistrationDocument);
router.patch('/:id/status', teamRegistration_controller_1.updateRegistrationStatus);
router.delete('/:id', teamRegistration_controller_1.deleteRegistration);
exports.default = router;
