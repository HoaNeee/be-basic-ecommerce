import { DefaultEventsMap, Server, Socket } from "socket.io";

let _io: Server<DefaultEventsMap, DefaultEventsMap, DefaultEventsMap, any> =
  null;
let _socket: Socket<DefaultEventsMap, DefaultEventsMap, DefaultEventsMap, any> =
  null;

export const connect = (
  io: Server<DefaultEventsMap, DefaultEventsMap, DefaultEventsMap, any>
) => {
  _io = io;
  _io.on("connection", (socket) => {
    _socket = socket;
    // console.log("a user connect " + socket.id);
  });
};

export const disconnect = () => {
  if (_io) {
    _io.disconnectSockets();
  }
};

export const getIo = () => {
  if (!_io) {
    throw new Error("not connect");
  }
  return _io;
};

export const getSocket = () => {
  if (!_socket) {
    throw new Error("not connect");
  }
  return _socket;
};
