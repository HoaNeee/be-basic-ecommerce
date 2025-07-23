"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getRefreshToken = exports.getAccessToken = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const getAccessToken = (payload, expire) => {
    const token = jsonwebtoken_1.default.sign(payload, process.env.SECRET_JWT_KEY, expire && {
        expiresIn: expire,
    });
    return token;
};
exports.getAccessToken = getAccessToken;
const getRefreshToken = (payload, expire) => {
    const token = jsonwebtoken_1.default.sign(payload, process.env.SECRET_JWT_KEY, {
        expiresIn: expire !== null && expire !== void 0 ? expire : undefined,
    });
    return token;
};
exports.getRefreshToken = getRefreshToken;
