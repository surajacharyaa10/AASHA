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
        // ─── AASHA BLE Mesh Simulation (Expo Go fallback) ────────────────────────
        // Relays BLE packets between mobile devices on the same backend connection.
        // This simulates phone-to-phone BLE when the native expo-ble-kit module
        // isn't available (Expo Go). In a dev build, real BLE is used instead.
        socket.on('aasha:ble_packet', (data) => {
            // Broadcast to all OTHER clients (not sender)
            socket.broadcast.emit('aasha:ble_packet', data);
        });
        socket.on('aasha:peer_joined', (data) => {
            socket.broadcast.emit('aasha:peer_joined', data);
        });
        socket.on('aasha:peer_left', (data) => {
            socket.broadcast.emit('aasha:peer_left', data);
        });
        socket.on('disconnect', () => {
            console.log(`Client disconnected: ${socket.id}`);
        });
    });
};
exports.setupSockets = setupSockets;
