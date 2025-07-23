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
exports.dealOfMonth = exports.checkCode = exports.promotions = void 0;
const promotion_model_1 = __importDefault(require("../../models/promotion.model"));
const pagination_1 = __importDefault(require("../../../helpers/pagination"));
const promotions = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        let find = {
            deleted: false,
        };
        const now = new Date();
        find = Object.assign(Object.assign({}, find), { $or: [
                {
                    $and: [
                        { startAt: { $lte: now } },
                        { endAt: { $gte: now } },
                        { maxUse: { $gt: 0 } },
                    ],
                },
                {
                    endAt: null,
                    maxUse: { $gt: 0 },
                },
            ] });
        const totalRecord = yield promotion_model_1.default.countDocuments(find);
        const initObjPagination = {
            page: 1,
            limitItems: 5,
        };
        if (req.query.limit) {
            initObjPagination.limitItems = Number(req.query.limit);
        }
        const objectPagination = (0, pagination_1.default)(initObjPagination, req.query, 0);
        const records = yield promotion_model_1.default.find(find)
            .skip(objectPagination.skip)
            .limit(objectPagination.limitItems);
        res.json({
            code: 200,
            message: "OK",
            data: records,
            totalRecord: totalRecord,
        });
    }
    catch (error) {
        console.log(error);
        res.json({
            code: 400,
            message: error.message || error,
        });
    }
});
exports.promotions = promotions;
const checkCode = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const code = req.query.code;
        const promotion = yield promotion_model_1.default.findOne({
            code: code,
            deleted: false,
        });
        if (!promotion) {
            throw Error("Code Invalid!");
        }
        const now = Date.now();
        const start = new Date(promotion.startAt).getTime();
        const end = promotion.endAt;
        if (start > now) {
            throw Error("Code not applied!");
        }
        if (end) {
            if (new Date(end).getTime() < now) {
                throw Error("Code has expired!");
            }
        }
        if (promotion.maxUse <= 0) {
            throw Error("Code has out of uses!");
        }
        res.json({
            code: 200,
            message: "OK",
            data: {
                promotionType: promotion.promotionType,
                value: promotion.value,
                title: promotion.title,
            },
        });
    }
    catch (error) {
        console.log(error);
        res.json({
            code: 400,
            message: error.message || error,
        });
    }
});
exports.checkCode = checkCode;
const dealOfMonth = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const now = new Date();
        const find = {
            deleted: false,
            startAt: { $lt: now },
            $or: [
                {
                    endAt: { $gte: now },
                },
                {
                    endAt: null,
                },
            ],
        };
        const deals = yield promotion_model_1.default.find(find).sort({ value: "desc" }).lean();
        res.json({
            code: 200,
            message: "OK",
            data: deals[0],
        });
    }
    catch (error) {
        console.log(error);
        res.json({
            code: 400,
            message: error.message || error,
        });
    }
});
exports.dealOfMonth = dealOfMonth;
