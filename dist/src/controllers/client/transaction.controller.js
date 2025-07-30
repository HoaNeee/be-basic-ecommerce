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
exports.transactionDetail = exports.transactionChange = exports.startTransaction = void 0;
const transaction_model_1 = __importDefault(require("../../models/transaction.model"));
const cartDetail_model_1 = __importDefault(require("../../models/cartDetail.model"));
const product_model_1 = __importDefault(require("../../models/product.model"));
const subProduct_model_1 = __importDefault(require("../../models/subProduct.model"));
const variationOption_model_1 = __importDefault(require("../../models/variationOption.model"));
const startTransaction = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const user_id = req.userId;
        const existingTransaction = yield transaction_model_1.default.findOne({
            user_id,
            status: "processing",
        });
        if (existingTransaction) {
            res.json({
                code: 400,
                message: "You already have an ongoing transaction, please complete or cancel it first.",
            });
            return;
        }
        const body = req.body;
        const transaction = new transaction_model_1.default(Object.assign({ user_id, status: "processing" }, body));
        yield transaction.save();
        res.json({
            code: 200,
            message: "Transaction started!",
            data: transaction,
        });
    }
    catch (error) {
        res.json({
            code: 400,
            message: error.message || error,
        });
    }
});
exports.startTransaction = startTransaction;
const transactionChange = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const user_id = req.userId;
        const action = req.query.action;
        if (action === "complete") {
            return transactionComplete(req, res);
        }
        if (action === "cancel") {
            return transactionCancel(req, res);
        }
        const { step, payload } = req.body;
        const transaction = yield transaction_model_1.default.findOneAndUpdate({
            user_id,
            status: "processing",
        }, {
            $set: {
                current_step: step,
                transaction_info: payload,
            },
        });
        if (!transaction) {
            res.json({
                code: 404,
                message: "Transaction not found or already completed.",
            });
            return;
        }
        res.json({
            code: 200,
            message: "Transaction updated!",
        });
    }
    catch (error) {
        res.json({
            code: 400,
            message: error.message || error,
        });
    }
});
exports.transactionChange = transactionChange;
const transactionDetail = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const user_id = req.userId;
        const transaction = yield transaction_model_1.default.findOne({
            user_id,
            status: "processing",
        }).lean();
        if (transaction) {
            const cart_ids = transaction.cart_items;
            const cart_items_info = yield cartDetail_model_1.default.find({
                _id: { $in: cart_ids },
            }).lean();
            const productIds = cart_items_info.map((item) => item.product_id);
            const subIds = cart_items_info.map((item) => item.sub_product_id);
            const products = yield product_model_1.default.find({
                _id: { $in: productIds },
                deleted: false,
            });
            const subProducts = yield subProduct_model_1.default.find({
                _id: { $in: subIds },
                deleted: false,
            });
            for (const item of cart_items_info) {
                const indexProduct = products.findIndex((pro) => pro.id === item.product_id);
                item["cartItem_id"] = item._id;
                if (indexProduct !== -1) {
                    item["thumbnail"] = products[indexProduct].thumbnail;
                    item["title"] = products[indexProduct].title;
                    item["slug"] = products[indexProduct].slug;
                    item["cost"] = products[indexProduct].cost;
                }
                if (item.options.length > 0) {
                    const indexSub = subProducts.findIndex((sub) => sub.id === item.sub_product_id);
                    const options_info = [];
                    for (const option_id of item.options) {
                        const option = yield variationOption_model_1.default.findOne({ _id: option_id });
                        if (option) {
                            options_info.push({
                                title: option.title,
                                value: option.id,
                                variation_id: option.variation_id,
                            });
                        }
                    }
                    item["options_info"] = [...options_info];
                    if (indexSub !== -1) {
                        item["thumbnail"] = subProducts[indexSub].thumbnail;
                        item["price"] = subProducts[indexSub].price;
                        item["discountedPrice"] = subProducts[indexSub].discountedPrice;
                        item["stock"] = subProducts[indexSub].stock;
                        item["cost"] = subProducts[indexSub].cost;
                        item["SKU"] = subProducts[indexSub].SKU;
                        item["thumbnail_product"] = subProducts[indexSub].thumbnail;
                    }
                }
                else {
                    item["price"] = products[indexProduct].price;
                    item["discountedPrice"] = products[indexProduct].discountedPrice;
                    item["stock"] = products[indexProduct].stock;
                    item["SKU"] = products[indexProduct].SKU;
                }
                if (!item["SKU"]) {
                    item["SKU"] = products[indexProduct].SKU;
                }
            }
            transaction["cart_items_info"] = cart_items_info;
        }
        res.json({
            code: 200,
            message: "Transaction detail retrieved successfully.",
            data: transaction,
        });
    }
    catch (error) {
        res.json({
            code: 400,
            message: error.message || error,
        });
    }
});
exports.transactionDetail = transactionDetail;
const transactionCancel = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const user_id = req.userId;
        const transaction = yield transaction_model_1.default.findOneAndUpdate({ user_id, status: "processing" }, {
            $set: {
                status: "canceled",
            },
        });
        if (!transaction) {
            res.json({
                code: 404,
                message: "Transaction not found or already completed.",
            });
            return;
        }
        res.json({
            code: 200,
            message: "Transaction canceled!",
        });
    }
    catch (error) {
        res.json({
            code: 400,
            message: error.message || error,
        });
    }
});
const transactionComplete = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const user_id = req.userId;
        const transaction = yield transaction_model_1.default.findOneAndUpdate({ user_id, status: "processing" }, {
            $set: {
                status: "completed",
            },
        });
        if (!transaction) {
            res.json({
                code: 404,
                message: "Transaction not found or already completed.",
            });
            return;
        }
        res.json({
            code: 200,
            message: "Transaction completed!",
        });
    }
    catch (error) {
        res.json({
            code: 400,
            message: error.message || error,
        });
    }
});
