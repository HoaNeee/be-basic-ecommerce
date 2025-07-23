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
const category_model_1 = __importDefault(require("../../models/category.model"));
const pagination_1 = __importDefault(require("../../../helpers/pagination"));
const product_model_1 = __importDefault(require("../../models/product.model"));
const index = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const find = {
            deleted: false,
        };
        const totalRecord = yield category_model_1.default.countDocuments(find);
        const initObjPagination = {
            page: 1,
            limitItems: totalRecord,
        };
        if (req.query.limit) {
            initObjPagination.limitItems = Number(req.query.limit);
        }
        const objectPagination = (0, pagination_1.default)(initObjPagination, req.query, 0);
        const records = yield category_model_1.default.find(find)
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
        const slug = req.body.slug;
        const parent_id = req.body.parent_id;
        const exist = yield category_model_1.default.findOne({
            $and: [{ slug: slug }, { parent_id: parent_id }, { deleted: false }],
        });
        if (exist) {
            throw new Error("Category is existing!");
        }
        const record = new category_model_1.default(req.body);
        yield record.save();
        res.json({
            code: 200,
            message: "Create new successfully!",
            data: record,
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
        const id = req.params.id;
        const slug = req.body.slug;
        const parent_id = req.body.parent_id;
        const exist = yield category_model_1.default.findOne({
            $and: [
                { slug: slug },
                { parent_id: parent_id },
                { deleted: false },
                { _id: { $ne: id } },
            ],
        });
        if (exist) {
            throw new Error("Category is existing!");
        }
        yield category_model_1.default.updateOne({ _id: id }, req.body);
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
        const category_id = req.params.id;
        const findProductAndPulll = (category_id) => __awaiter(void 0, void 0, void 0, function* () {
            const product = yield product_model_1.default.find({ categories: category_id });
            const ids = product.map((item) => item.id);
            yield product_model_1.default.updateMany({ _id: { $in: ids } }, {
                $pull: { categories: { $in: [category_id] } },
            });
        });
        const findAllChildrenAndDel = (id) => __awaiter(void 0, void 0, void 0, function* () {
            const records = yield category_model_1.default.find({ parent_id: id, deleted: false });
            if (records.length > 0) {
                for (const item of records) {
                    item.deleted = true;
                    item.deletedAt = new Date().toISOString();
                    yield item.save();
                    findProductAndPulll(item.id);
                    yield findAllChildrenAndDel(item.id);
                }
            }
        });
        yield findAllChildrenAndDel(category_id);
        findProductAndPulll(category_id);
        yield category_model_1.default.updateOne({ _id: category_id }, { deleted: true, deletedAt: new Date().toISOString() });
        res.json({
            code: 200,
            message: "Successfully!",
        });
    }
    catch (error) {
        res.json({
            code: 400,
            message: error.message || error,
        });
    }
});
exports.remove = remove;
