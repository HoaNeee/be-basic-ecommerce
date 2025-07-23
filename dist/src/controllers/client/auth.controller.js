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
exports.changeSetting = exports.changePassword = exports.logout = exports.getInfo = exports.updateProfile = exports.register = exports.login = void 0;
const getAccessToken_1 = require("../../../helpers/getAccessToken");
const md5_1 = __importDefault(require("md5"));
const customer_model_1 = __importDefault(require("../../models/customer.model"));
const cart_model_1 = __importDefault(require("../../models/cart.model"));
const notification_model_1 = __importDefault(require("../../models/notification.model"));
const login = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { email, password, isRemember } = req.body;
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
        res.cookie("jwt_token", accessToken, {
            secure: false,
            httpOnly: true,
            sameSite: "lax",
            path: "/",
        });
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
        const exits = yield customer_model_1.default.findOne({ email: email, deleted: false });
        if (exits) {
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
        const customer = yield customer_model_1.default.findByIdAndUpdate(user_id, body);
        const notify = new notification_model_1.default({
            user_id: user_id,
            type: "profile",
            title: "Profile Updated",
            body: "You just updated your profile",
            image: body.avatar || customer.avatar,
            receiver: "customer",
        });
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
        res.json({
            code: 200,
            message: "Get info OK!",
            data: Object.assign(Object.assign({}, customer), { user_id: customer._id }),
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
        res.clearCookie("jwt_token");
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
