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
exports.adminRead = exports.customerRead = exports.admin = exports.checkRead = exports.customers = void 0;
const notification_model_1 = __importDefault(require("../models/notification.model"));
const customers = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const user_id = req.userId;
        let find = {
            deleted: false,
            user_id: user_id,
            receiver: "customer",
        };
        const notifications = yield notification_model_1.default.find(find).sort({
            createdAt: "desc",
        });
        res.json({
            code: 200,
            message: "Notification OK!",
            data: {
                notifications,
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
exports.customers = customers;
const checkRead = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const user_id = req.userId;
        let find = {
            deleted: false,
            user_id: user_id,
            receiver: "customer",
            isRead: false,
        };
        const len = yield notification_model_1.default.countDocuments(find).limit(1);
        res.json({
            code: 200,
            message: "Notification OK!",
            data: !!len,
        });
    }
    catch (error) {
        res.json({
            code: 400,
            message: error.message,
        });
    }
});
exports.checkRead = checkRead;
const admin = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const notifications = yield notification_model_1.default.find({
            deleted: false,
            receiver: "admin",
        }).sort({ createdAt: "desc" });
        res.json({
            code: 200,
            message: "Notification OK!",
            data: {
                notifications,
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
exports.admin = admin;
const customerRead = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const notify_id = req.params.id;
        const user_id = req.userId;
        yield notification_model_1.default.updateOne({ _id: notify_id, user_id: user_id }, {
            isRead: true,
        });
        res.json({
            code: 200,
            message: "OK!",
            data: [],
        });
    }
    catch (error) {
        res.json({
            code: 400,
            message: error.message,
        });
    }
});
exports.customerRead = customerRead;
const adminRead = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const notify_id = req.params.id;
        yield notification_model_1.default.updateOne({ _id: notify_id }, {
            isRead: true,
        });
        res.json({
            code: 200,
            message: "OK!",
            data: [],
        });
    }
    catch (error) {
        res.json({
            code: 400,
            message: error.message,
        });
    }
});
exports.adminRead = adminRead;
