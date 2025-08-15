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
exports.dataExport = exports.exportExcel = exports.form = exports.remove = exports.update = exports.create = exports.suppliers = void 0;
const supplier_model_1 = __importDefault(require("../../models/supplier.model"));
const pagination_1 = __importDefault(require("../../../helpers/pagination"));
const category_model_1 = __importDefault(require("../../models/category.model"));
const suppliers = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const find = {
            deleted: false,
        };
        const isTakingReturn = req.query.isTakingReturn;
        const keyword = req.query.keyword;
        const categories = req.query.categories;
        if (categories && categories !== "") {
            const array = categories.split(",");
            find["categories"] = { $in: array };
        }
        if (isTakingReturn !== undefined &&
            isTakingReturn !== null &&
            isTakingReturn !== "") {
            find["isTaking"] = Number(isTakingReturn);
        }
        if (keyword) {
            find["name"] = { $regex: keyword, $options: "si" };
        }
        const initObjectPagination = {
            page: 1,
            limitItems: 10,
        };
        const totalRecord = yield supplier_model_1.default.countDocuments(find);
        if (req.query.limit) {
            initObjectPagination.limitItems = Number(req.query.limit);
        }
        const objectPagination = (0, pagination_1.default)(initObjectPagination, req.query, totalRecord);
        const records = yield supplier_model_1.default.find(find)
            .skip(objectPagination.skip)
            .limit(objectPagination.limitItems);
        res.json({
            code: 200,
            data: records,
            totalRecord: totalRecord,
        });
    }
    catch (error) {
        res.json({
            code: 500,
            message: error.message,
        });
    }
});
exports.suppliers = suppliers;
const create = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const supplier = new supplier_model_1.default(req.body);
        yield supplier.save();
        res.json({
            code: 200,
            message: "Create new successfully!",
            data: supplier,
        });
    }
    catch (error) {
        console.log(error);
        res.json({
            code: 500,
            message: error.message || error,
        });
    }
});
exports.create = create;
const update = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const recordId = req.params.id;
        yield supplier_model_1.default.updateOne({ _id: recordId }, req.body);
        res.json({
            code: 200,
            message: "Update successfully!",
        });
    }
    catch (error) {
        console.log(error);
        res.json({
            code: 500,
            message: error.message || error,
        });
    }
});
exports.update = update;
const remove = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const recordId = req.params.id;
        yield supplier_model_1.default.updateOne({ _id: recordId }, { deleted: true, deletedAt: new Date().toISOString() });
        res.json({
            code: 200,
            message: "successfully!",
        });
    }
    catch (error) {
        console.log(error);
        res.json({
            code: 500,
            message: error.message || error,
        });
    }
});
exports.remove = remove;
const form = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const rule = (name) => {
            return {
                required: true,
                message: "Please enter " + name,
            };
        };
        const categories = yield category_model_1.default.find({ deleted: false }).select("title _id");
        const formData = {
            nameForm: "supplier",
            size: "large",
            labelCol: 8,
            layout: "horizontal",
            title: "Supplier",
            formItems: [
                {
                    key: "name",
                    value: "name",
                    label: "Supplier Name",
                    rule: rule("Supplier Name"),
                    placeholder: "Entersupplier name",
                    type: "default",
                },
                {
                    key: "email",
                    value: "email",
                    label: "Supplier Email",
                    rule: rule("Supplier email"),
                    placeholder: "Enter Supplier email",
                    type: "default",
                    typeInput: "email",
                },
                {
                    key: "categories",
                    value: "categories",
                    label: "Category",
                    rule: rule("Categories"),
                    placeholder: "Select product category",
                    type: "select",
                    look_items: categories.map((item) => ({
                        label: item.title,
                        value: item._id,
                    })),
                },
                {
                    key: "contact",
                    value: "contact",
                    label: "Contact Number",
                    placeholder: "Enter supplier contact number",
                    type: "default",
                },
                {
                    key: "type",
                    value: "isTaking",
                    label: "Taking",
                    type: "checkbox",
                    typeInput: "checkbox",
                },
            ],
        };
        res.json({
            code: 200,
            message: "OK",
            data: formData,
        });
    }
    catch (error) {
        res.json({
            code: 500,
            message: error.message,
        });
    }
});
exports.form = form;
const exportExcel = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { start, end } = req.query;
        let find = {};
        if (start && end) {
            find = {
                $and: [
                    {
                        createdAt: { $gte: start },
                    },
                    { createdAt: { $lte: end } },
                    { deleted: false },
                ],
            };
        }
        const { select, value, page } = req.body.options;
        let skip = (page - 1) * value;
        const totalRecord = yield supplier_model_1.default.countDocuments(find);
        if (value === totalRecord) {
            skip = 0;
        }
        const records = yield supplier_model_1.default.find(find)
            .select((select || []).join(" "))
            .skip(skip)
            .limit(value);
        res.json({
            code: 200,
            message: "successfully!",
            data: records,
        });
    }
    catch (error) {
        console.log(error);
        res.json({
            code: 500,
            message: error.message || error,
        });
    }
});
exports.exportExcel = exportExcel;
const dataExport = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const page = Number(req.query.page);
        const limit = Number(req.query.limit);
        const start = req.query.start;
        const end = req.query.end;
        const find = {
            $and: [
                {
                    createdAt: { $gte: start },
                },
                { createdAt: { $lte: end } },
                { deleted: false },
            ],
        };
        let skip = (page - 1) * limit;
        const totalRecord = yield supplier_model_1.default.countDocuments(find);
        if (limit === totalRecord) {
            skip = 0;
        }
        const records = yield supplier_model_1.default.countDocuments({
            $and: [
                {
                    createdAt: { $gte: start },
                },
                { createdAt: { $lte: end } },
                { deleted: false },
            ],
        })
            .skip(skip)
            .limit(limit);
        res.json({
            code: 200,
            message: "successfully!",
            data: records,
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
exports.dataExport = dataExport;
