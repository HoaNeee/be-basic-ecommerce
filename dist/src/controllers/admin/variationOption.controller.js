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
const variationOption_model_1 = __importDefault(require("../../models/variationOption.model"));
const variation_model_1 = __importDefault(require("../../models/variation.model"));
const subProductOption_model_1 = __importDefault(require("../../models/subProductOption.model"));
const index = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const find = {
            deleted: false,
        };
        const { variation_id } = req.query;
        if (!variation_id) {
            throw Error("Missing variation_id!");
        }
        const variation = yield variation_model_1.default.findOne({ _id: variation_id });
        find.variation_id = variation.id;
        const records = yield variationOption_model_1.default.find(find);
        res.json({
            code: 200,
            message: "OK",
            data: records,
            variation: variation,
            totalRecord: 0,
        });
    }
    catch (error) {
        res.json({
            code: 400,
            message: error.message || error,
        });
    }
});
exports.index = index;
const create = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const exist = yield variationOption_model_1.default.findOne({
            $and: [
                { key: req.body.key },
                { deleted: false },
                { variation_id: req.body.variation_id },
            ],
        });
        if (exist) {
            throw Error("Option already existing!");
        }
        const record = new variationOption_model_1.default(req.body);
        yield record.save();
        res.json({
            code: 200,
            message: "Successfully!!",
            data: record,
        });
    }
    catch (error) {
        res.json({
            code: 400,
            message: error.message || error,
        });
    }
});
exports.create = create;
const edit = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const option_id = req.params.id;
        if (!option_id) {
            throw Error("Missing variation_option_id");
        }
        yield variationOption_model_1.default.updateOne({ _id: option_id }, req.body);
        res.json({
            code: 200,
            message: "Updated!!",
        });
    }
    catch (error) {
        res.json({
            code: 400,
            message: error.message || error,
        });
    }
});
exports.edit = edit;
const remove = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const option_id = req.params.id;
        if (!option_id) {
            throw Error("Missing variation_option_id!!");
        }
        yield subProductOption_model_1.default.updateMany({ variation_option_id: { $in: [option_id] } }, { deleted: true, deletedAt: new Date() });
        yield variationOption_model_1.default.updateOne({ _id: option_id }, { deleted: true, deletedAt: new Date() });
        res.json({
            code: 200,
            message: "Deleted",
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
