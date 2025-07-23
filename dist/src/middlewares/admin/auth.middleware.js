"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.isAccess = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const isAccess = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (!req.headers.authorization) {
            res.json({
                code: 401,
                message: "Please sent request with token",
            });
            return;
        }
        const accessToken = req.headers.authorization.split(" ")[1];
        const decoded = jsonwebtoken_1.default.verify(accessToken, process.env.SECRET_JWT_KEY);
        const userId = decoded.userId;
        req.userId = userId;
        next();
    }
    catch (error) {
        res.json({
            code: 402,
            message: error.message,
        });
    }
});
exports.isAccess = isAccess;
