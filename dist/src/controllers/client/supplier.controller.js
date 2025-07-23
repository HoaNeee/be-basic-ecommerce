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
exports.index = void 0;
const supplier_model_1 = __importDefault(require("../../models/supplier.model"));
const pagination_1 = __importDefault(require("../../../helpers/pagination"));
const index = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const find = {
            deleted: false,
        };
        const totalRecord = yield supplier_model_1.default.countDocuments(find);
        const initObjectPagination = {
            page: 1,
            limitItems: totalRecord,
        };
        if (req.query.limit) {
            initObjectPagination.limitItems = Number(req.query.limit);
        }
        const objectPagination = (0, pagination_1.default)(initObjectPagination, req.query, totalRecord);
        const records = yield supplier_model_1.default.find(find)
            .skip(objectPagination.skip)
            .limit(objectPagination.limitItems);
        res.json({
            code: 200,
            data: {
                suppliers: records,
                totalRecord: totalRecord,
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
exports.index = index;
