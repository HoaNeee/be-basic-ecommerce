"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const dotenv_1 = __importDefault(require("dotenv"));
const database = __importStar(require("./configs/database"));
const cors_1 = __importDefault(require("cors"));
const index_route_1 = __importDefault(require("./src/routes/admin/index.route"));
const index_route_2 = __importDefault(require("./src/routes/client/index.route"));
const notification_route_1 = __importDefault(require("./src/routes/notification.route"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const node_http_1 = __importDefault(require("node:http"));
const socket_io_1 = require("socket.io");
const socket = __importStar(require("./socket"));
const express_session_1 = __importDefault(require("express-session"));
dotenv_1.default.config();
database.connect();
const app = (0, express_1.default)();
const server = node_http_1.default.createServer(app);
const whiteList = [
    "http://localhost:3000",
    "http://localhost:5173",
    "https://shop.kakrist.site",
    "https://admin-panel-tawny-mu.vercel.app",
    "https://basic-e-commerce-kkrist.vercel.app",
];
const io = new socket_io_1.Server(server, {
    cors: {
        origin: whiteList,
        credentials: true,
    },
});
app.use((0, cors_1.default)({
    origin: whiteList,
    credentials: true,
}));
app.use((0, cookie_parser_1.default)());
app.use(express_1.default.urlencoded({ extended: false }));
app.use(express_1.default.json());
app.use((0, express_session_1.default)({
    secret: process.env.SESSION_SECRET,
    resave: true,
    saveUninitialized: false,
    cookie: { secure: false },
}));
(0, index_route_2.default)(app);
(0, index_route_1.default)(app);
(0, notification_route_1.default)(app);
socket.connect(io);
const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
    console.log(`server is running at port ${PORT}`);
});
