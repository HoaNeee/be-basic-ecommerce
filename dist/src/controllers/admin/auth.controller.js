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
exports.changePassword = exports.editProfile = exports.profile = exports.refreshToken = exports.googleLogin = exports.register = exports.login = void 0;
const user_model_1 = __importDefault(require("../../models/user.model"));
const getAccessToken_1 = require("../../../helpers/getAccessToken");
const md5_1 = __importDefault(require("md5"));
const generate = __importStar(require("../../../helpers/generateString"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const timeAccess = 60 * 60 * 5;
const login = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { email, password, isRemember } = req.body;
        const user = yield user_model_1.default.findOne({ email: email, deleted: false });
        if (!user) {
            throw Error("Email not found!");
        }
        if ((0, md5_1.default)(password) !== user.password) {
            throw Error("Password not correct!");
        }
        const timeExireIsRemember = 60 * 60 * 24 * 15;
        const timeExire = 60 * 60 * 24 * 1;
        const accessToken = (0, getAccessToken_1.getAccessToken)({
            userId: user.id,
            email: email,
            role: user.role,
        }, timeAccess);
        const refreshToken = (0, getAccessToken_1.getRefreshToken)({
            userId: user.id,
        }, isRemember ? timeExireIsRemember : timeExire);
        res.json({
            code: 200,
            message: "OK",
            data: {
                userId: user.id,
                fullName: user.fullName || "User",
                role: user.role,
                email: user.email,
                accessToken: accessToken,
                refreshToken: refreshToken,
                avatar: user.avatar,
            },
        });
    }
    catch (error) {
        res.json({
            code: 400,
            message: error.message,
        });
    }
});
exports.login = login;
const register = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { fullName, email, password } = req.body;
        const existEmail = yield user_model_1.default.findOne({ email: email, deleted: false });
        if (existEmail) {
            res.json({
                code: 400,
                message: "Email already exist!",
            });
            return;
        }
        const user = new user_model_1.default({
            email,
            password: (0, md5_1.default)(password),
            fullName,
        });
        yield user.save();
        const timeExire = 60 * 60 * 24;
        const accessToken = (0, getAccessToken_1.getAccessToken)({
            userId: user.id,
            email: email,
            role: user.role,
        }, timeAccess);
        const refreshToken = (0, getAccessToken_1.getRefreshToken)({
            userId: user.id,
        }, timeExire);
        res.json({
            code: 200,
            message: "OK",
            data: {
                id: user.id,
                fullName: user.fullName,
                role: user.role,
                email: user.email,
                accessToken: accessToken,
                refreshToken: refreshToken,
            },
        });
    }
    catch (error) {
        res.json({
            code: 500,
            message: "Error in server " + error,
        });
    }
});
exports.register = register;
const googleLogin = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { fullname, email } = req.body;
        const timeExire = 60 * 60 * 24 * 7;
        const existUser = yield user_model_1.default.findOne({ email: email, deleted: false });
        if (existUser) {
            const accessToken = (0, getAccessToken_1.getAccessToken)({
                userId: existUser.id,
                email: email,
                role: existUser.role,
            }, timeAccess);
            const refreshToken = (0, getAccessToken_1.getRefreshToken)({
                userId: existUser.id,
            }, timeExire);
            res.json({
                code: 200,
                data: {
                    id: existUser.id,
                    fullName: existUser.fullName,
                    role: existUser.role,
                    email: existUser.email,
                    accessToken: accessToken,
                    refreshToken: refreshToken,
                    social: existUser.social,
                },
            });
            return;
        }
        const password = generate.number(6);
        const user = new user_model_1.default({
            fullname,
            email,
            password: (0, md5_1.default)(password),
            social: "google",
        });
        const accessToken = (0, getAccessToken_1.getAccessToken)({
            userId: user.id,
            email: email,
            role: user.role,
        }, timeAccess);
        const refreshToken = (0, getAccessToken_1.getRefreshToken)({
            userId: user.id,
        }, timeExire);
        const data = {
            id: user.id,
            fullName: user.fullName,
            role: user.role,
            accessToken: accessToken,
            refreshToken: refreshToken,
            social: user.social,
        };
        yield user.save();
        res.json({
            code: 200,
            message: "Successfully",
            data: data,
        });
    }
    catch (error) {
        res.json({
            code: 500,
            message: error.message,
        });
    }
});
exports.googleLogin = googleLogin;
const refreshToken = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (!req.headers.authorization) {
            res.json({
                code: 401,
                message: "Please sent request with token!",
            });
            return;
        }
        const refreshToken = req.headers.authorization.split(" ")[1];
        const decoded = jsonwebtoken_1.default.verify(refreshToken, process.env.SECRET_JWT_KEY);
        const userId = decoded.userId;
        const user = yield user_model_1.default.findOne({ _id: userId });
        if (!user) {
            res.json({
                code: 404,
                message: "User not found",
            });
            return;
        }
        const newAccessToken = (0, getAccessToken_1.getAccessToken)({
            userId: user.id,
            email: user.email,
            role: user.role,
        }, timeAccess);
        res.json({
            code: 200,
            message: "ok",
            accessToken: newAccessToken,
        });
    }
    catch (error) {
        console.log(error.message);
        res.json({
            code: 403,
            message: error.message,
        });
    }
});
exports.refreshToken = refreshToken;
const profile = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const user_id = req.userId;
        const user = yield user_model_1.default.findOne({ _id: user_id }).select("-password -createdAt -updatedAt");
        res.json({
            code: 200,
            message: "OK",
            data: user,
        });
    }
    catch (error) {
        res.json({
            code: 400,
            message: error.message,
        });
    }
});
exports.profile = profile;
const editProfile = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const user_id = req.userId;
        const body = req.body;
        yield user_model_1.default.updateOne({ _id: user_id }, body);
        res.json({
            code: 200,
            message: "Update success!",
        });
    }
    catch (error) {
        res.json({
            code: 400,
            message: error.message,
        });
    }
});
exports.editProfile = editProfile;
const changePassword = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const user_id = req.userId;
        const { password, newPassword, confirmPassword } = req.body;
        const user = yield user_model_1.default.findOne({ _id: user_id });
        if (newPassword !== confirmPassword) {
            throw Error("The confirm password do not match!");
        }
        if ((0, md5_1.default)(password) !== user.password) {
            throw Error("Current Password is not correct!");
        }
        user.password = (0, md5_1.default)(newPassword);
        yield user.save();
        res.json({
            code: 200,
            message: "Update success!",
        });
    }
    catch (error) {
        res.json({
            code: 400,
            message: error.message,
        });
    }
});
exports.changePassword = changePassword;
