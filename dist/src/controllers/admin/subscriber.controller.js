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
exports.updateSentEmail = exports.getSubscribers = void 0;
const subscriber_model_1 = __importDefault(require("../../models/subscriber.model"));
const pagination_1 = __importDefault(require("../../../helpers/pagination"));
const getSubscribers = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const find = {};
        const keyword = req.query.keyword;
        const isSent = req.query.isSent;
        if (isSent && isSent !== "all") {
            const isSentBoolean = isSent === "sent";
            find["isSent"] = isSentBoolean;
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
const updateSentEmail = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const { email, isSent } = req.body;
        const subscriber = yield subscriber_model_1.default.findOneAndUpdate({
            _id: id,
            email,
        }, {
            isSent: !isSent,
        });
        if (!subscriber) {
            res.status(404).json({ code: 404, error: "Subscriber not found" });
            return;
        }
        if (isSent) {
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
