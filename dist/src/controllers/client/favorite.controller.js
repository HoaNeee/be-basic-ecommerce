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
exports.removeProduct = exports.addProduct = exports.getListFavoriteInfo = exports.index = void 0;
const product_model_1 = __importDefault(require("../../models/product.model"));
const subProduct_model_1 = __importDefault(require("../../models/subProduct.model"));
const favorite_model_1 = __importDefault(require("../../models/favorite.model"));
const supplier_model_1 = __importDefault(require("../../models/supplier.model"));
const product_1 = require("../../../utils/product");
const pagination_1 = __importDefault(require("../../../helpers/pagination"));
const index = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const user_id = req.userId;
        const list = yield favorite_model_1.default.findOne({ user_id: user_id, deleted: false });
        res.json({
            code: 200,
            message: "OK",
            data: {
                list,
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
exports.index = index;
const getListFavoriteInfo = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const user_id = req.userId;
        const list = yield favorite_model_1.default.findOne({ user_id: user_id, deleted: false });
        if (!list) {
            res.json({
                code: 200,
                message: "OK",
                data: {
                    products: [],
                },
            });
            return;
        }
        const product_ids = list.products;
        const totalRecord = yield product_model_1.default.countDocuments({
            _id: { $in: product_ids },
            deleted: false,
        });
        const initPagination = {
            page: 1,
            limitItems: totalRecord,
        };
        if (req.query.limit) {
            initPagination.limitItems = Number(req.query.limit);
        }
        const objectPagination = (0, pagination_1.default)(initPagination, req.query, totalRecord);
        const products = yield product_model_1.default.find({
            _id: { $in: product_ids },
            deleted: false,
        })
            .skip(objectPagination.skip)
            .limit(objectPagination.limitItems)
            .lean();
        const subProducts = yield subProduct_model_1.default.find({
            product_id: { $in: product_ids },
            deleted: false,
        });
        for (const product of products) {
            if (product.productType === "variations") {
                const subs = subProducts.filter((sub) => sub.product_id === String(product._id));
                (0, product_1.solvePriceStock)(product, subs);
            }
            const supplier = yield supplier_model_1.default.findOne({ _id: product.supplier_id });
            if (supplier) {
                product["supplierName"] = supplier.name;
            }
        }
        res.json({
            code: 200,
            message: "Favorite OK!",
            data: {
                products,
                totalRecord,
                totalPage: objectPagination.totalPage,
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
exports.getListFavoriteInfo = getListFavoriteInfo;
const addProduct = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const user_id = req.userId;
        const body = req.body;
        const list = body.listFavorite;
        const favorite = yield favorite_model_1.default.findOne({ user_id: user_id });
        if (!favorite) {
            const newFavorite = new favorite_model_1.default({
                products: list,
                user_id: user_id,
            });
            yield newFavorite.save();
        }
        else {
            favorite.products = [...list];
            yield favorite.save();
        }
        res.json({
            code: 200,
            message: "Added!",
            data: {},
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
exports.addProduct = addProduct;
const removeProduct = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const user_id = req.userId;
        const product_id = req.params.product_id;
        if (!product_id) {
            throw Error("Missing product_id");
        }
        const favorite = yield favorite_model_1.default.findOne({ user_id: user_id });
        if (!favorite) {
            throw Error("Not found!");
        }
        favorite.products = [
            ...favorite.products.filter((item) => item !== product_id),
        ];
        yield favorite.save();
        res.json({
            code: 200,
            message: "Removed!",
            data: {},
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
exports.removeProduct = removeProduct;
