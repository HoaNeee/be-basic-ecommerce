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
exports.removeComment = exports.getComments = exports.remove = exports.index = void 0;
const review_model_1 = __importDefault(require("../../models/review.model"));
const comment_model_1 = __importDefault(require("../../models/comment.model"));
const customer_model_1 = __importDefault(require("../../models/customer.model"));
const product_model_1 = __importDefault(require("../../models/product.model"));
const pagination_1 = __importDefault(require("../../../helpers/pagination"));
const index = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        let find = {
            deleted: false,
        };
        let find_customers = {
            deleted: false,
        };
        const keyword = req.query.keyword || "";
        if (keyword) {
            find_customers = Object.assign(Object.assign({}, find_customers), { $or: [
                    { firstName: { $regex: keyword, $options: "si" } },
                    { lastName: { $regex: keyword, $options: "si" } },
                ] });
        }
        const customers = yield customer_model_1.default.find(find_customers);
        const cus_ids = customers.map((item) => item.id);
        if (keyword) {
            find["user_id"] = { $in: cus_ids };
        }
        const totalRecord = yield review_model_1.default.countDocuments(find);
        const initPagination = {
            page: 1,
            limitItems: totalRecord,
        };
        if (req.query.limit) {
            initPagination.limitItems = Number(req.query.limit);
        }
        const objPagination = (0, pagination_1.default)(initPagination, req.query, totalRecord);
        const reviews = yield review_model_1.default.find(find)
            .skip(objPagination.skip)
            .limit(objPagination.limitItems)
            .lean();
        const productIds = reviews.map((item) => item.product_id);
        const rvIds = reviews.map((item) => String(item._id));
        const comments = yield comment_model_1.default.find({
            deleted: false,
            review_id: { $in: rvIds },
        });
        const products = yield product_model_1.default.find({ _id: { $in: productIds } });
        for (const review of reviews) {
            const cus = customers.find((item) => String(item.id) === review.user_id);
            const product = products.find((item) => item.id === review.product_id);
            if (cus) {
                review["product"] = product.toObject();
                review["customer"] = cus.toObject();
                review["commentCount"] = comments.filter((it) => it.review_id === String(review._id)).length;
            }
        }
        res.json({
            code: 200,
            message: "OK",
            data: {
                reviews,
                totalRecord,
            },
        });
    }
    catch (error) {
        console.log(error.message);
        res.json({
            code: 400,
            message: error.message,
        });
    }
});
exports.index = index;
const remove = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const rv_id = req.params.id;
        if (!rv_id) {
            throw Error("Missing _id");
        }
        yield comment_model_1.default.deleteMany({ review_id: rv_id });
        yield review_model_1.default.deleteOne({ _id: rv_id });
        res.json({
            code: 200,
            message: "Delete review success!",
        });
    }
    catch (error) {
        console.log(error.message);
        res.json({
            code: 400,
            message: error.message,
        });
    }
});
exports.remove = remove;
const getComments = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const review_id = req.params.id;
        if (!review_id) {
            throw Error("Missing _id");
        }
        let find = {
            deleted: false,
            review_id,
        };
        const totalRecord = yield comment_model_1.default.countDocuments(find);
        const initPagination = {
            page: 1,
            limitItems: totalRecord,
        };
        if (req.query.limit) {
            initPagination.limitItems = Number(req.query.limit);
        }
        const objPagination = (0, pagination_1.default)(initPagination, req.query, totalRecord);
        const comments = yield comment_model_1.default.find(find)
            .skip(objPagination.skip)
            .limit(objPagination.limitItems)
            .lean();
        const cus_ids = comments.map((item) => item.user_id);
        const customers = yield customer_model_1.default.find({ _id: { $in: cus_ids } }).lean();
        for (const comment of comments) {
            const cus = customers.find((item) => String(item._id));
            if (cus) {
                comment["customer"] = cus;
            }
        }
        res.json({
            code: 200,
            message: "OK",
            data: {
                comments,
                totalRecord,
            },
        });
    }
    catch (error) {
        console.log(error.message);
        res.json({
            code: 400,
            message: error.message,
        });
    }
});
exports.getComments = getComments;
const removeComment = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const comment_id = req.params.id;
        if (!comment_id) {
            throw Error("Missing _id");
        }
        yield comment_model_1.default.deleteMany({ parent_id: comment_id });
        yield comment_model_1.default.deleteOne({ _id: comment_id });
        res.json({
            code: 200,
            message: "Deleted!!",
        });
    }
    catch (error) {
        console.log(error.message);
        res.json({
            code: 400,
            message: error.message,
        });
    }
});
exports.removeComment = removeComment;
