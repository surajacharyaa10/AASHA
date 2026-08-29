"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setupSockets = void 0;
const setupSockets = (io) => {
    io.on('connection', (socket) => {
        console.log(`Client connected: ${socket.id}`);
        // Join a room for real-time updates
        socket.on('joinRoom', (roomId) => {
            socket.join(roomId);
            console.log(`Client ${socket.id} joined room ${roomId}`);
        });
        // Leave a room
        socket.on('leaveRoom', (roomId) => {
            socket.leave(roomId);
            console.log(`Client ${socket.id} left room ${roomId}`);
        });
        socket.on('disconnect', () => {
            console.log(`Client disconnected: ${socket.id}`);
        });
    });
};
exports.setupSockets = setupSockets;
