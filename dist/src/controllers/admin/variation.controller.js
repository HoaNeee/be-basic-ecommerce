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
const variation_model_1 = __importDefault(require("../../models/variation.model"));
const variationOption_model_1 = __importDefault(require("../../models/variationOption.model"));
const subProductOption_model_1 = __importDefault(require("../../models/subProductOption.model"));
const index = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const find = {
            deleted: false,
        };
        const records = yield variation_model_1.default.find(find);
        res.json({
            code: 200,
            message: "OK",
            data: records,
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
        const exist = yield variation_model_1.default.findOne({
            key: req.body.key,
            deleted: false,
        });
        if (exist) {
            throw Error("Variation already existing!");
        }
        const variation = new variation_model_1.default(req.body);
        yield variation.save();
        res.json({
            code: 200,
            message: "Successfully!!",
            data: variation,
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
        const variation_id = req.params.id;
        if (!variation_id) {
            throw Error("Missing variation_id!");
        }
        yield variation_model_1.default.updateOne({ _id: variation_id }, req.body);
        res.json({
            code: 200,
            message: "Successfully!",
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
        const variation_id = req.params.id;
        if (!variation_id) {
            throw Error("Missing variation_id!");
        }
        const variation = yield variation_model_1.default.findOne({
            _id: variation_id,
            deleted: false,
        });
        if (variation) {
            const variationOptions = yield variationOption_model_1.default.find({
                variation_id: variation.id,
                deleted: false,
            });
            const ids = variationOptions.map((item) => item.id);
            yield subProductOption_model_1.default.updateMany({
                variation_option_id: { $in: ids },
            }, { deleted: true, deletedAt: new Date() });
            yield variationOption_model_1.default.updateMany({ variation_id: { $in: [variation.id] } }, { deleted: true, deletedAt: new Date() });
        }
        variation.deleted = true;
        variation.deletedAt = new Date();
        yield variation.save();
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
