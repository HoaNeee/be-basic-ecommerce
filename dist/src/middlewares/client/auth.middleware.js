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
const auth_controller_1 = require("../../controllers/client/auth.controller");
const isAccess = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const token = req.cookies.jwt_token;
        if (!token) {
            res.json({
                code: 401,
                message: "You are not logged in!",
            });
            return;
        }
        const decoded = jsonwebtoken_1.default.verify(token, process.env.SECRET_JWT_KEY);
        req.userId = decoded.userId;
        if (req.session["has_welcome"] === undefined ||
            req.session["has_welcome"] === null) {
            req.session["has_welcome"] = true;
        }
        else {
            req.session["has_welcome"] = false;
        }
        next();
    }
    catch (error) {
        (0, auth_controller_1.clearCookie)(res);
        res.json({
            code: 402,
            message: error.message,
        });
    }
});
exports.isAccess = isAccess;
