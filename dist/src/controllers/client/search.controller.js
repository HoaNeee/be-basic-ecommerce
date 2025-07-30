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
exports.suggest = exports.search = void 0;
const product_1 = require("../../../utils/product");
const product_model_1 = __importDefault(require("../../models/product.model"));
const blog_model_1 = __importDefault(require("../../models/blog.model"));
const subProduct_model_1 = __importDefault(require("../../models/subProduct.model"));
const user_model_1 = __importDefault(require("../../models/user.model"));
const product_2 = require("../../../utils/product");
const supplier_model_1 = __importDefault(require("../../models/supplier.model"));
const search = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { keyword } = req.query;
        const input = convertInput(keyword);
        if (!input) {
            const { products_info } = yield (0, product_1.getTopSellHelper)(req, 12);
            const suppliers = yield supplier_model_1.default.find({
                deleted: false,
                _id: { $in: products_info.map((item) => item.supplier_id) },
            });
            for (const element of products_info) {
                const supplier = suppliers.find((sup) => String(sup._id) === element.supplier_id);
                if (supplier) {
                    element["supplierName"] = supplier.name || "Unknown";
                }
            }
            const blogs = yield blog_model_1.default.find({ deleted: false, status: "published" })
                .sort({ view: -1 })
                .limit(5)
                .lean();
            const response = [];
            const authorIds = blogs.map((blog) => blog.user_id.toString());
            const authors = yield user_model_1.default.find({ _id: { $in: authorIds } }).select("fullName avatar email");
            for (const element of blogs) {
                const author = authors.find((author) => author._id.toString() === element.user_id.toString());
                if (author) {
                    element["author"] = author;
                }
            }
            response.push({
                type: "products",
                data: products_info.map((product) => {
                    return Object.assign({}, product);
                }),
            });
            response.push({
                type: "blogs",
                data: blogs.map((blog) => {
                    return Object.assign(Object.assign({}, blog), { type: "blogs" });
                }),
            });
            res.json({
                code: 200,
                message: "Search OK",
                data: response,
            });
            return;
        }
        const products = yield product_model_1.default.find({
            $text: { $search: input },
            deleted: false,
        })
            .limit(12)
            .lean();
        const blogs = yield blog_model_1.default.find({
            $text: { $search: input },
            deleted: false,
            status: "published",
        })
            .limit(5)
            .lean();
        const productIds = products.map((pro) => pro._id.toString());
        const supplier_ids = products.map((pro) => pro.supplier_id.toString());
        const suppliers = yield supplier_model_1.default.find({
            _id: { $in: supplier_ids },
            deleted: false,
        });
        const authorIds = blogs.map((blog) => blog.user_id.toString());
        const subProducts = yield subProduct_model_1.default.find({
            product_id: { $in: productIds },
            deleted: false,
        });
        const authors = yield user_model_1.default.find({
            _id: { $in: authorIds },
        }).select("fullName avatar email");
        for (const product of products) {
            const supplier = suppliers.find((supplier) => String(supplier._id) === product.supplier_id.toString());
            product["supplierName"] = supplier.name || "Unknown";
            const subs = subProducts.filter((sub) => sub.product_id === String(product._id));
            if (subs.length > 0) {
                (0, product_2.solvePriceStock)(product, subs);
            }
        }
        const response = [];
        response.push({
            type: "products",
            data: products.map((product) => {
                return Object.assign({}, product);
            }),
        });
        response.push({
            type: "blogs",
            data: blogs.map((blog) => {
                const author = authors.find((author) => String(author._id) === blog.user_id.toString());
                if (author) {
                    delete author._id;
                }
                return Object.assign(Object.assign({}, blog), { type: "blogs", author: author });
            }),
        });
        res.json({
            code: 200,
            message: "Search OK",
            data: response,
        });
    }
    catch (error) {
        res.json({
            code: 500,
            message: error.message,
        });
    }
});
exports.search = search;
const suggest = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { keyword } = req.query;
        const convertedKeyword = convertInput(keyword);
        const options = "sixum";
        const wordProductsFilters = convertedKeyword.split(" ").map((w) => {
            return {
                $or: [
                    { title: { $regex: w, $options: options } },
                    { shortDescription: { $regex: w, $options: options } },
                    { SKU: { $regex: w, $options: options } },
                    { slug: { $regex: w, $options: options } },
                ],
            };
        });
        const suggestsProduct = yield product_model_1.default.find({
            deleted: false,
            $and: wordProductsFilters,
        })
            .limit(10)
            .select("title shortDescription SKU")
            .lean();
        const wordBlogsFilters = convertedKeyword.split(" ").map((w) => {
            return {
                $or: [
                    { title: { $regex: w, $options: options } },
                    { excerpt: { $regex: w, $options: options } },
                    { slug: { $regex: w, $options: options } },
                ],
            };
        });
        const suggestsBlogs = yield blog_model_1.default.find({
            deleted: false,
            status: "published",
            $and: wordBlogsFilters,
        })
            .limit(2)
            .select("title excerpt")
            .lean();
        const response = [];
        const productSet = new Set();
        let limit = 5;
        for (const sugProduct of suggestsProduct) {
            delete sugProduct._id;
            for (const key in sugProduct) {
                const cv = convertInput(sugProduct[key]);
                if (cv.includes(convertedKeyword) && !productSet.has(cv) && limit > 0) {
                    response.push(sugProduct[key].replace(/-/g, " ").replace(/\s+/g, " "));
                    productSet.add(cv);
                    --limit;
                    break;
                }
            }
        }
        for (const sugBlog of suggestsBlogs) {
            delete sugBlog._id;
            for (const key in sugBlog) {
                const cv = convertInput(sugBlog[key]);
                if (cv.includes(convertedKeyword)) {
                    response.push(sugBlog[key].replace(/-/g, " ").replace(/\s+/g, " "));
                    break;
                }
            }
        }
        res.json({
            code: 200,
            message: "Suggest OK",
            data: response,
        });
    }
    catch (error) {
        res.json({
            code: 500,
            message: error.message,
        });
    }
});
exports.suggest = suggest;
const convertInput = (input) => {
    function removeVietnameseTones(str) {
        return (str
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .replace(/đ/g, "d")
            .replace(/Đ/g, "D")
            .trim()
            .replace(/\s+/g, " ")
            .toLowerCase());
    }
    return removeVietnameseTones(input);
};
