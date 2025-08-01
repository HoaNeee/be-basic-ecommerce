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
exports.topReviews = exports.removeReview = exports.removeComment = exports.edit = exports.createComment = exports.create = exports.getComments = exports.reviews = void 0;
const address_model_1 = __importDefault(require("../../models/address.model"));
const review_model_1 = __importDefault(require("../../models/review.model"));
const comment_model_1 = __importDefault(require("../../models/comment.model"));
const customer_model_1 = __importDefault(require("../../models/customer.model"));
const pagination_1 = __importDefault(require("../../../helpers/pagination"));
const reviews = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const product_id = req.query.product_id;
        const limit = Number(req.query.limit) || 3;
        const page = Number(req.query.page) || 1;
        const skip = (page - 1) * limit;
        const totalRecord = yield review_model_1.default.countDocuments({
            product_id: product_id,
            deleted: false,
        });
        const reviews = yield review_model_1.default.find({
            product_id: product_id,
            deleted: false,
        })
            .limit(limit)
            .skip(skip)
            .lean();
        for (const item of reviews) {
            const commentCnt = yield comment_model_1.default.countDocuments({
                review_id: item._id,
                deleted: false,
                parent_id: "",
            });
            const user = yield customer_model_1.default.findOne({
                _id: item.user_id,
                deleted: false,
            }).select("firstName lastName avatar");
            item["user"] = user;
            item[`countComment`] = commentCnt;
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
        console.log(error);
        res.json({
            code: 400,
            message: error.message || error,
        });
    }
});
exports.reviews = reviews;
const getComments = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const review_id = req.params.review_id;
        const parent_id = ((_a = req.query) === null || _a === void 0 ? void 0 : _a.parent_id) || "";
        const comments = yield comment_model_1.default.find({
            review_id: review_id,
            parent_id: parent_id,
            deleted: false,
        }).lean();
        for (const comment of comments) {
            const countComment = yield comment_model_1.default.countDocuments({
                parent_id: comment._id,
                deleted: false,
            });
            const user = yield customer_model_1.default.findOne({
                _id: comment.user_id,
                deleted: false,
            }).select("firstName lastName avatar");
            comment[`countComment`] = countComment;
            comment[`user`] = user;
        }
        res.json({
            code: 200,
            message: "OK",
            data: comments,
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
exports.getComments = getComments;
const create = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const user_id = req.userId;
        const body = req.body;
        const review = new review_model_1.default(Object.assign(Object.assign({}, body), { user_id: user_id }));
        yield review.save();
        res.json({
            code: 200,
            message: "Submited!",
            data: review,
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
const createComment = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const user_id = req.userId;
        const body = req.body;
        const comment = new comment_model_1.default(Object.assign(Object.assign({}, body), { user_id: user_id }));
        yield comment.save();
        res.json({
            code: 200,
            message: "Post success!",
            data: comment,
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
exports.createComment = createComment;
const edit = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const address_id = req.params.id;
        if (!address_id) {
            throw Error("Missing address_id");
        }
        const body = req.body;
        const isDefault = body.isDefault;
        const address = yield address_model_1.default.findOne({ _id: address_id, deleted: false });
        if (!address) {
            throw Error("Address not found!");
        }
        if (isDefault && !address.isDefault) {
            yield address_model_1.default.updateMany({ user_id: address.user_id, deleted: false }, { isDefault: false });
        }
        yield address_model_1.default.updateOne({ _id: address_id }, body);
        res.json({
            code: 200,
            message: "Updated!",
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
const removeComment = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const comment_id = req.params.id;
        if (!comment_id) {
            throw Error("Missing comment_id");
        }
        yield comment_model_1.default.deleteMany({ parent_id: comment_id });
        yield comment_model_1.default.deleteOne({ _id: comment_id });
        res.json({
            code: 200,
            message: "Deleted!",
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
exports.removeComment = removeComment;
const removeReview = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const review_id = req.params.id;
        if (!review_id) {
            throw Error("Missing review_id");
        }
        yield comment_model_1.default.deleteMany({ review_id: review_id });
        yield review_model_1.default.deleteOne({ _id: review_id });
        res.json({
            code: 200,
            message: "Deleted!",
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
exports.removeReview = removeReview;
const topReviews = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const totalRecord = yield review_model_1.default.countDocuments({ deleted: false });
        const initPagination = {
            page: 1,
            limitItems: totalRecord,
        };
        if (req.query.limit) {
            initPagination.limitItems = Number(req.query.limit);
        }
        const objPagination = (0, pagination_1.default)(initPagination, req.query, totalRecord);
        const reviews = yield review_model_1.default.aggregate([
            { $match: { deleted: false } },
            {
                $addFields: {
                    contentLength: { $strLenCP: "content" },
                    user_object_id: { $toObjectId: "$user_id" },
                },
            },
            { $sort: { star: -1, contentLength: -1 } },
            { $limit: objPagination.limitItems },
            { $skip: objPagination.skip },
            {
                $lookup: {
                    from: "customers",
                    localField: "user_object_id",
                    foreignField: "_id",
                    as: "user",
                    pipeline: [
                        {
                            $project: {
                                firstName: 1,
                                lastName: 1,
                                avatar: 1,
                            },
                        },
                    ],
                },
            },
            { $unwind: "$user" },
        ]);
        res.json({
            code: 200,
            message: "Top reviews OK",
            data: {
                reviews,
                totalRecord,
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
exports.topReviews = topReviews;
