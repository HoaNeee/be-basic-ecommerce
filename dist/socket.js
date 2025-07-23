"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSocket = exports.getIo = exports.disconnect = exports.connect = void 0;
let _io = null;
let _socket = null;
const connect = (io) => {
    _io = io;
    _io.on("connection", (socket) => {
        _socket = socket;
    });
};
exports.connect = connect;
const disconnect = () => {
    if (_io) {
        _io.disconnectSockets();
    }
};
exports.disconnect = disconnect;
const getIo = () => {
    if (!_io) {
        throw new Error("not connect");
    }
    return _io;
};
exports.getIo = getIo;
const getSocket = () => {
    if (!_socket) {
        throw new Error("not connect");
    }
    return _socket;
};
exports.getSocket = getSocket;
