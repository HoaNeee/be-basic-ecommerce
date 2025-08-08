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
exports.verifyOTP = exports.forgotPassword = exports.googleLogin = exports.changeSetting = exports.changePassword = exports.logout = exports.getInfo = exports.updateProfile = exports.register = exports.login = exports.clearCookie = void 0;
const getAccessToken_1 = require("../../../helpers/getAccessToken");
const md5_1 = __importDefault(require("md5"));
const customer_model_1 = __importDefault(require("../../models/customer.model"));
const cart_model_1 = __importDefault(require("../../models/cart.model"));
const notification_model_1 = __importDefault(require("../../models/notification.model"));
const genarateHelper = __importStar(require("../../../helpers/generateString"));
const sendMail_1 = require("../../../helpers/sendMail");
const forgotPassword_model_1 = __importDefault(require("../../models/forgotPassword.model"));
let enviroment = process.env.NODE_ENV || "dev";
const clearCookie = (res) => {
    if (enviroment === "dev") {
        res.clearCookie("jwt_token", {
            path: "/",
        });
        return;
    }
    res.clearCookie("jwt_token", {
        secure: true,
        httpOnly: true,
        sameSite: "none",
        path: "/",
        domain: ".kakrist.site",
    });
};
exports.clearCookie = clearCookie;
const setCookie = (res, accessToken, maxAge) => {
    if (enviroment === "dev") {
        res.cookie("jwt_token", accessToken, {
            secure: false,
            httpOnly: true,
            sameSite: "lax",
            path: "/",
            maxAge: maxAge || undefined,
        });
        return;
    }
    res.cookie("jwt_token", accessToken, {
        secure: true,
        httpOnly: true,
        sameSite: "none",
        path: "/",
        maxAge: maxAge || undefined,
        domain: ".kakrist.site",
    });
};
const login = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { email, password, isRemmember } = req.body;
        const user = yield customer_model_1.default.findOne({ email: email, deleted: false });
        if (!user) {
            throw Error("Email not found!!");
        }
        if ((0, md5_1.default)(password) !== user.password) {
            throw Error("Password not correct!!");
        }
        const cart = yield cart_model_1.default.findOne({ user_id: user.id, deleted: false });
        if (!cart) {
            const newCart = new cart_model_1.default({
                user_id: user.id,
            });
            yield newCart.save();
        }
        const accessToken = (0, getAccessToken_1.getAccessToken)({
            userId: user.id,
        });
        setCookie(res, accessToken, isRemmember ? 1000 * 60 * 60 * 24 * 15 : undefined);
        req.session["has_welcome"] = false;
        res.json({
            code: 200,
            message: "Login success!",
            data: {
                isLogin: true,
                firstName: user.firstName,
                lastName: user.lastName,
                user_id: user.id,
                avatar: user.avatar,
                phone: user.phone,
                email: user.email,
                setting: user.setting,
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
        const email = req.body.email;
        const exists = yield customer_model_1.default.findOne({ email: email, deleted: false });
        if (exists) {
            throw Error("Email already existing!!");
        }
        req.body.password = (0, md5_1.default)(req.body.password);
        if (!req.body.firstName && !req.body.lastName) {
            const num = yield customer_model_1.default.countDocuments();
            req.body.firstName = "User";
            req.body.lastName = num + 1;
        }
        const customer = new customer_model_1.default(req.body);
        yield customer.save();
        res.json({
            code: 200,
            message: "Register successfully!!",
        });
    }
    catch (error) {
        res.json({
            code: 400,
            message: error.message,
        });
    }
});
exports.register = register;
const updateProfile = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const user_id = req.userId;
        const body = req.body;
        const customer = yield customer_model_1.default.findOne({ _id: user_id, deleted: false });
        const notify = new notification_model_1.default({
            user_id: user_id,
            type: "profile",
            title: "Profile Updated",
            body: "You just updated your profile",
            image: body.avatar || customer.avatar,
            receiver: "customer",
        });
        if (customer.provider === "google") {
            customer.phone = body.phone || customer.phone;
            yield customer.save();
            res.json({
                code: 200,
                message: "Update profile success!",
            });
            return;
        }
        yield customer_model_1.default.updateOne({ _id: user_id }, body);
        yield notify.save();
        res.json({
            code: 200,
            message: "Update profile success!",
        });
    }
    catch (error) {
        res.json({
            code: 400,
            message: error.message,
        });
    }
});
exports.updateProfile = updateProfile;
const getInfo = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const user_id = req.userId;
        const customer = yield customer_model_1.default.findOne({
            _id: user_id,
            deleted: false,
        })
            .select("-password -createdAt -updatedAt -deleted")
            .lean();
        if (!customer) {
            throw Error("Not allowed!");
        }
        console.log(req.session["has_welcome"]);
        res.json({
            code: 200,
            message: "Get info OK!",
            data: Object.assign(Object.assign({}, customer), { user_id: customer._id, has_welcome: req.session["has_welcome"] }),
        });
    }
    catch (error) {
        res.json({
            code: 400,
            message: error.message,
        });
    }
});
exports.getInfo = getInfo;
const logout = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        (0, exports.clearCookie)(res);
        res.json({
            code: 200,
            message: "Logout success!",
        });
    }
    catch (error) {
        res.json({
            code: 400,
            message: error.message,
        });
    }
});
exports.logout = logout;
const changePassword = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const user_id = req.userId;
        const { password, newPassword, confirmPassword } = req.body;
        const customer = yield customer_model_1.default.findOne({ _id: user_id });
        if (newPassword !== confirmPassword) {
            throw Error("Confirm password do not match!");
        }
        if (customer.password !== (0, md5_1.default)(password)) {
            throw Error("Password is not correct!");
        }
        customer.password = (0, md5_1.default)(newPassword);
        yield customer.save();
        const notify = new notification_model_1.default({
            user_id: customer.id,
            type: "profile",
            title: "Password Update successfully",
            body: "Your password has been updated successfully",
            image: customer.avatar,
            receiver: "customer",
        });
        yield notify.save();
        res.json({
            code: 200,
            message: "Change password success!",
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
const changeSetting = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const user_id = req.userId;
        const body = req.body;
        const customer = yield customer_model_1.default.findOne({ _id: user_id });
        customer.setting = body;
        yield customer.save();
        res.json({
            code: 200,
            message: "success!",
        });
    }
    catch (error) {
        res.json({
            code: 400,
            message: error.message,
        });
    }
});
exports.changeSetting = changeSetting;
const googleLogin = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const code = req.body.code;
        if (!code) {
            res.json({
                code: 400,
                message: "Missing code",
            });
            return;
        }
        const userInfo = yield handleInfoUser(code);
        const email = userInfo.email;
        const avatar = userInfo.picture || "";
        const name = userInfo.name.split(" ");
        const firstName = userInfo.given_name
            ? userInfo.given_name
            : (name === null || name === void 0 ? void 0 : name.length) > 0
                ? name[0]
                : "";
        const lastName = userInfo.family_name
            ? userInfo.family_name
            : (name === null || name === void 0 ? void 0 : name.length) > 1
                ? name[1]
                : "";
        const providerId = userInfo.sub;
        const exist = yield customer_model_1.default.findOne({
            email: email,
            deleted: false,
        });
        const timeCookie = 1000 * 60 * 60 * 24 * 5;
        req.session["has_welcome"] = false;
        if (exist) {
            if (exist.provider === "google" && exist.providerId === providerId) {
                yield customer_model_1.default.updateOne({
                    _id: exist.id,
                }, {
                    avatar: avatar,
                    firstName: firstName,
                    lastName: lastName,
                });
                const accessToken = (0, getAccessToken_1.getAccessToken)({
                    userId: exist.id,
                });
                setCookie(res, accessToken, timeCookie);
                res.json({
                    code: 200,
                    message: "Google login success!",
                    data: {
                        isLogin: true,
                        firstName: firstName,
                        lastName: lastName,
                        user_id: exist.id,
                        avatar: avatar,
                        phone: exist.phone,
                        email: exist.email,
                        setting: exist.setting,
                        provider: exist.provider,
                    },
                });
                return;
            }
            else {
                const accessToken = (0, getAccessToken_1.getAccessToken)({
                    userId: exist.id,
                });
                setCookie(res, accessToken, timeCookie);
                res.json({
                    code: 200,
                    message: "Login google success!",
                    data: {
                        isLogin: false,
                        firstName: exist.firstName,
                        lastName: exist.lastName,
                        user_id: exist.id,
                        avatar: exist.avatar,
                        phone: exist.phone,
                        email: exist.email,
                        setting: exist.setting,
                        provider: exist.provider,
                    },
                });
                return;
            }
        }
        const customer = new customer_model_1.default({
            firstName: firstName,
            lastName: lastName,
            email: email,
            avatar: avatar,
            password: null,
            provider: "google",
            providerId: providerId,
            social: {
                google: true,
            },
        });
        yield customer.save();
        const newCart = new cart_model_1.default({
            user_id: customer.id,
        });
        yield newCart.save();
        const accessToken = (0, getAccessToken_1.getAccessToken)({
            userId: customer.id,
        });
        setCookie(res, accessToken, timeCookie);
        res.json({
            code: 200,
            message: "Google login success!",
            data: {
                isLogin: true,
                firstName: customer.firstName,
                lastName: customer.lastName,
                user_id: customer.id,
                avatar: customer.avatar,
                phone: customer.phone,
                email: customer.email,
                setting: customer.setting,
                provider: customer.provider,
            },
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
const forgotPassword = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const email = req.body.email;
        if (!email) {
            throw Error("Email is required!");
        }
        rateForgotPasswordLimit(req);
        const exist = yield customer_model_1.default.findOne({
            email: email,
            deleted: false,
        });
        if (!exist) {
            throw Error("Email not found!");
        }
        if (exist.provider === "google") {
            throw Error("You are using Google account, please login with Google!");
        }
        const existEmailInForgotPassword = yield forgotPassword_model_1.default.findOne({
            email: email,
        });
        if (existEmailInForgotPassword) {
            const expiredAt = existEmailInForgotPassword.expiredAt;
            res.json({
                code: 200,
                message: "Check email success!",
                data: {
                    email: email,
                    expiredAt: expiredAt,
                },
            });
            return;
        }
        const otp = genarateHelper.number(6);
        const record = new forgotPassword_model_1.default({
            email: email,
            otp: otp,
        });
        yield record.save();
        const subject = "Forgot Password - Your OTP Code";
        const html = `
    <h1>Forgot Password</h1>
    <p>We received a request to reset your password. Use the following OTP code to reset your password:</p>
    <p>OTP will expire in 3 minutes</p>
    <h2 style="color: #000;">${otp}</h2>
    <p>If you did not request this, please ignore this email.</p>
    <p>Thank you!</p>
    `;
        (0, sendMail_1.sendMail)(email, subject, html, req);
        res.json({
            code: 200,
            message: "Check email success!",
            data: {
                email: email,
                expiredAt: record.expiredAt,
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
exports.forgotPassword = forgotPassword;
const verifyOTP = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const email = req.body.email;
        const otp = req.body.otp;
        if (!email || !otp) {
            throw Error("Email and OTP are required!");
        }
        const record = yield forgotPassword_model_1.default.findOne({
            email: email,
        });
        if (!record) {
            throw Error("OTP expired or invalid!");
        }
        if (record.otp !== otp) {
            throw Error("Invalid OTP!");
        }
        const newPassword = genarateHelper.number(6);
        const customer = yield customer_model_1.default.findOne({
            email: email,
            deleted: false,
        });
        if (!customer) {
            throw Error("Email not found!");
        }
        customer.password = (0, md5_1.default)(newPassword);
        yield customer.save();
        yield forgotPassword_model_1.default.deleteOne({
            email: email,
        });
        const subject = "Change Password successfully";
        const html = `
    <h1>Change Password</h1>
    <p>Your password has been changed successfully. Here are your new login credentials:</p>
    <p>Email: ${email}</p>
    <p>Password: ${newPassword}</p>
    <p>Please log in with your new password.</p>
    <p>If you did not request this change, please contact support immediately.</p>
    <p>Thank you!</p>
    `;
        (0, sendMail_1.sendMail)(email, subject, html, req);
        res.json({
            code: 200,
            message: "Verify OTP success!",
        });
    }
    catch (error) {
        res.json({
            code: 400,
            message: error.message,
        });
    }
});
exports.verifyOTP = verifyOTP;
const rateForgotPasswordLimit = (req) => {
    const emailPrev = req.session["forgot_email"];
    const email = req.body.email;
    if (!emailPrev) {
        req.session["forgot_email"] = email;
        req.session["forgot_count"] = 1;
    }
    else {
        if (emailPrev !== email) {
            req.session["forgot_email"] = email;
            req.session["forgot_count"] = 1;
        }
        else {
            const expire = req.session["forgot_count_expire"];
            if (expire && Date.now() > expire) {
                req.session["forgot_count"] = 1;
            }
            const count = req.session["forgot_count"];
            if (count >= 5) {
                throw Error("You have reached the maximum number of requests. Please try again later.");
            }
            req.session["forgot_count_expire"] = Date.now() + 1000 * 60 * 5;
            req.session["forgot_count"] = count + 1;
        }
    }
};
const handleInfoUser = (code) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const uri = enviroment === "dev"
            ? "https://localhost:3000/auth/google"
            : "https://shop.kakrist.site/auth/google";
        const params = new URLSearchParams({
            code,
            client_id: process.env.GOOGLE_CLIENT_ID || "",
            client_secret: process.env.GOOGLE_CLIENT_SECRET || "",
            redirect_uri: uri,
            grant_type: "authorization_code",
        });
        const response = yield fetch("https://oauth2.googleapis.com/token", {
            method: "POST",
            headers: {
                "Content-Type": "application/x-www-form-urlencoded",
            },
            body: params.toString(),
        });
        if (!response.ok) {
            throw Error("Failed to exchange code for access token");
        }
        const data = yield response.json();
        const info = yield fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
            method: "GET",
            headers: {
                Authorization: `Bearer ${data.access_token}`,
            },
        });
        if (!info.ok) {
            throw Error("Failed to fetch user info");
        }
        return yield info.json();
    }
    catch (error) {
        throw new Error(`Error fetching user info: ${error.message}`);
    }
});
