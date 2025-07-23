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
exports.remove = exports.edit = exports.create = exports.index = void 0;
const promotion_model_1 = __importDefault(require("../../models/promotion.model"));
const pagination_1 = __importDefault(require("../../../helpers/pagination"));
const index = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const find = {
            deleted: false,
        };
        const totalRecord = yield promotion_model_1.default.countDocuments(find);
        const initObjPagination = {
            page: 1,
            limitItems: totalRecord,
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
exports.index = index;
const create = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const promotion = new promotion_model_1.default(req.body);
        yield promotion.save();
        res.json({
            code: 201,
            data: promotion,
            message: "Successfully!!",
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
exports.create = create;
const edit = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const promotion_id = req.params.id;
        if (!promotion_id) {
            throw Error("Missing _id!!");
        }
        yield promotion_model_1.default.updateOne({ _id: promotion_id }, req.body);
        res.json({
            code: 202,
            message: "Successfully!!",
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
exports.edit = edit;
const remove = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const promotion_id = req.params.id;
        if (!promotion_id) {
            throw Error("Missing _id!!");
        }
        yield promotion_model_1.default.deleteOne({ _id: promotion_id });
        res.json({
            code: 203,
            message: "Successfully!!",
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
exports.remove = remove;
