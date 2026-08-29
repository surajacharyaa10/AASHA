"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateRegistrationStatus = exports.uploadRegistrationDocument = exports.getTeamRegistrations = exports.registerRescueTeam = void 0;
const database_1 = require("../config/database");
const mongodb_1 = require("mongodb");
// 1. Submit new Rescue Team Registration Application
const registerRescueTeam = async (req, res) => {
    try {
        const { teamName, station, district, province, leadName, leadEmail, leadPhone, leadCitizenshipNumber, leadCitizenshipDocUrl, teamLetterDocUrl, capabilities = [], members = [], } = req.body;
        if (!teamName || !leadName || !leadEmail || !leadPhone) {
            return res.status(400).json({
                error: 'Team Name, Leader Name, Leader Email, and Leader Phone are required',
            });
        }
        const db = await (0, database_1.connectDB)();
        const registrationsCollection = db.collection('rescue_team_registrations');
        const newRegistration = {
            teamName: teamName.trim(),
            station: station?.trim() || 'Headquarters Base',
            district: district?.trim() || 'Solukhumbu',
            province: province?.trim() || 'Bagmati Province',
            leadName: leadName.trim(),
            leadEmail: leadEmail.trim().toLowerCase(),
            leadPhone: leadPhone.trim(),
            leadCitizenshipNumber: leadCitizenshipNumber?.trim() || '',
            leadCitizenshipDocUrl: leadCitizenshipDocUrl || null,
            teamLetterDocUrl: teamLetterDocUrl || null,
            capabilities: Array.isArray(capabilities) ? capabilities : [capabilities].filter(Boolean),
            membersCount: Array.isArray(members) ? members.length + 1 : 1,
            members: Array.isArray(members) ? members : [],
            status: 'pending_verification',
            createdAt: new Date(),
            updatedAt: new Date(),
        };
        const result = await registrationsCollection.insertOne(newRegistration);
        const saved = {
            id: result.insertedId.toString(),
            ...newRegistration,
        };
        return res.status(201).json({
            success: true,
            message: 'Rescue team registration application submitted for verification',
            registration: saved,
        });
    }
    catch (error) {
        console.error('Error submitting rescue team registration:', error);
        return res.status(500).json({ error: 'Failed to submit registration application' });
    }
};
exports.registerRescueTeam = registerRescueTeam;
// 2. Get all team registrations (with status filter)
const getTeamRegistrations = async (req, res) => {
    try {
        const db = await (0, database_1.connectDB)();
        const registrationsCollection = db.collection('rescue_team_registrations');
        const { status } = req.query;
        const query = {};
        if (status && status !== 'all') {
            query.status = status;
        }
        const records = await registrationsCollection
            .find(query)
            .sort({ createdAt: -1 })
            .toArray();
        return res.json({
            registrations: records.map((r) => ({
                id: r._id.toString(),
                teamName: r.teamName,
                station: r.station,
                district: r.district,
                province: r.province,
                leadName: r.leadName,
                leadEmail: r.leadEmail,
                leadPhone: r.leadPhone,
                leadCitizenshipNumber: r.leadCitizenshipNumber,
                leadCitizenshipDocUrl: r.leadCitizenshipDocUrl,
                teamLetterDocUrl: r.teamLetterDocUrl,
                capabilities: r.capabilities,
                membersCount: r.membersCount,
                members: r.members || [],
                status: r.status,
                availability: r.availability || 'available',
                assignment: r.assignment || null,
                readiness: r.readiness !== undefined ? r.readiness : 100,
                verificationNotes: r.verificationNotes,
                createdAt: r.createdAt,
            })),
        });
    }
    catch (error) {
        console.error('Error fetching registrations:', error);
        return res.status(500).json({ error: 'Failed to fetch team registrations' });
    }
};
exports.getTeamRegistrations = getTeamRegistrations;
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
// 3. Upload Document to Local Storage (Citizenship, Official Team Letter, Certifications)
const uploadRegistrationDocument = async (req, res) => {
    try {
        const file = req.file;
        if (!file) {
            return res.status(400).json({ error: 'No document file uploaded. Make sure field name is "document".' });
        }
        const ext = path_1.default.extname(file.originalname) || '.jpg';
        const filename = `doc_${Date.now()}_${Math.round(Math.random() * 1e9)}${ext}`;
        const filepath = path_1.default.join(__dirname, '../../public/uploads', filename);
        fs_1.default.writeFileSync(filepath, file.buffer);
        return res.json({
            success: true,
            url: `http://localhost:4000/uploads/${filename}`,
            publicId: filename,
        });
    }
    catch (error) {
        console.error('[Upload] Local document upload error:', error);
        return res.status(500).json({
            error: 'Failed to upload document locally',
            details: error.message || String(error),
        });
    }
};
exports.uploadRegistrationDocument = uploadRegistrationDocument;
// 4. Update registration status (Approve / Reject)
const updateRegistrationStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status, notes } = req.body;
        if (!mongodb_1.ObjectId.isValid(id)) {
            return res.status(400).json({ error: 'Invalid registration ID' });
        }
        const db = await (0, database_1.connectDB)();
        const registrationsCollection = db.collection('rescue_team_registrations');
        const rescueTeamsCollection = db.collection('rescue_teams');
        const updated = await registrationsCollection.findOneAndUpdate({ _id: new mongodb_1.ObjectId(id) }, {
            $set: {
                status,
                verificationNotes: notes || '',
                updatedAt: new Date(),
            },
        }, { returnDocument: 'after' });
        const doc = updated?.value || updated;
        // If approved, automatically provision into active rescue_teams collection
        if (status === 'approved' && doc) {
            await rescueTeamsCollection.updateOne({ registrationId: id }, {
                $set: {
                    id: `team-${id.slice(-6)}`,
                    name: doc.teamName,
                    initial: doc.teamName.charAt(0).toUpperCase(),
                    station: doc.station,
                    district: doc.district,
                    lead: doc.leadName,
                    phone: doc.leadPhone,
                    membersCount: doc.membersCount || 6,
                    capability: doc.capabilities.join(' · ') || 'General Mountain Rescue',
                    availability: 'available',
                    readiness: 100,
                    registrationId: id,
                    updatedAt: new Date(),
                },
            }, { upsert: true });
        }
        return res.json({ success: true, message: `Team status updated to ${status}` });
    }
    catch (error) {
        console.error('Error updating registration status:', error);
        return res.status(500).json({ error: 'Failed to update registration status' });
    }
};
exports.updateRegistrationStatus = updateRegistrationStatus;
