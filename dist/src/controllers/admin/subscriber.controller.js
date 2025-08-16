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
exports.updateSentAll = exports.updateBulk = exports.updateSentEmail = exports.getSubscribersStats = exports.getSubscribers = void 0;
const subscriber_model_1 = __importDefault(require("../../models/subscriber.model"));
const pagination_1 = __importDefault(require("../../../helpers/pagination"));
const getSubscribers = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const find = {};
        const keyword = req.query.keyword;
        const status = req.query.status;
        if (status && status !== "all") {
            find["status"] = status;
        }
        if (keyword) {
            find["email"] = { $regex: keyword, $options: "si" };
        }
        const initPagination = {
            page: 1,
            limitItems: 10,
        };
        if (req.query.limit) {
            initPagination.limitItems = parseInt(req.query.limit) || 10;
        }
        const totalRecord = yield subscriber_model_1.default.countDocuments(find);
        const pagination = (0, pagination_1.default)(initPagination, req.query, totalRecord);
        const subscribers = yield subscriber_model_1.default.find(find)
            .sort({ subscribedAt: -1 })
            .skip(pagination.skip)
            .limit(pagination.limitItems);
        res.status(200).json({
            code: 200,
            message: "Get subscribers successfully!",
            data: {
                subscribers,
                totalRecord,
            },
        });
    }
    catch (error) {
        res.status(500).json({ code: 500, error: "Failed to get subscribers" });
    }
});
exports.getSubscribers = getSubscribers;
const getSubscribersStats = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const totalSubscribers = yield subscriber_model_1.default.countDocuments();
        const sentSubscribers = yield subscriber_model_1.default.countDocuments({ status: "sent" });
        const notSentSubscribers = yield subscriber_model_1.default.countDocuments({
            status: "not-sent",
        });
        const cancelSubscribers = yield subscriber_model_1.default.countDocuments({
            status: "cancel",
        });
        res.status(200).json({
            code: 200,
            message: "Get subscribers stats successfully!",
            data: {
                totalSubscribers,
                sentSubscribers,
                notSentSubscribers,
                cancelSubscribers,
            },
        });
    }
    catch (error) {
        res
            .status(500)
            .json({ code: 500, error: "Failed to get subscribers stats" });
    }
});
exports.getSubscribersStats = getSubscribersStats;
const updateSentEmail = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const { email } = req.body;
        const subscriber = yield subscriber_model_1.default.findOneAndUpdate({
            _id: id,
            email,
        }, {
            status: "sent",
        }, {
            new: true,
        });
        if (!subscriber) {
            res.status(404).json({ code: 404, error: "Subscriber not found" });
            return;
        }
        if (subscriber.status === "sent") {
        }
        res.status(200).json({
            code: 200,
            message: "Update subscriber successfully!",
        });
    }
    catch (error) {
        res.status(500).json({ code: 500, error: "Failed to update subscriber" });
    }
});
exports.updateSentEmail = updateSentEmail;
const updateBulk = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const ids = req.body.ids;
        const action = req.body.action;
        const subscribers = yield subscriber_model_1.default.updateMany({
            _id: { $in: ids },
        }, {
            status: action,
        });
        if (!subscribers) {
            res.status(404).json({ code: 404, error: "Subscribers not found" });
            return;
        }
        if (action === "sent") {
        }
        res.status(200).json({
            code: 200,
            message: "Update subscribers successfully!",
        });
    }
    catch (error) {
        res.status(500).json({ code: 500, error: "Failed to update subscribers" });
    }
});
exports.updateBulk = updateBulk;
const updateSentAll = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const subscribers = yield subscriber_model_1.default.updateMany({
            $or: [{ status: "not-sent" }, { status: "sent" }],
        }, {
            status: "sent",
        });
        if (!subscribers) {
            res.status(404).json({ code: 404, error: "Subscribers not found" });
            return;
        }
        res.status(200).json({
            code: 200,
            message: "Update subscribers successfully!",
        });
    }
    catch (error) {
        res.status(500).json({ code: 500, error: "Failed to update subscribers" });
    }
});
exports.updateSentAll = updateSentAll;
