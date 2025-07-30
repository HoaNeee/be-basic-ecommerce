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
exports.testSocket = exports.lowQuantity = exports.topSell = exports.productsSKU = exports.getAllSKU = exports.changeMulti = exports.removeSubProduct = exports.remove = exports.filterProduct = exports.getPriceProduct = exports.editSubProduct = exports.edit = exports.create = exports.detail = exports.index = void 0;
const pagination_1 = __importDefault(require("../../../helpers/pagination"));
const subProduct_model_1 = __importDefault(require("../../models/subProduct.model"));
const subProductOption_model_1 = __importDefault(require("../../models/subProductOption.model"));
const product_model_1 = __importDefault(require("../../models/product.model"));
const variation_model_1 = __importDefault(require("../../models/variation.model"));
const variationOption_model_1 = __importDefault(require("../../models/variationOption.model"));
const socket_1 = require("../../../socket");
const product_1 = require("../../../utils/product");
var ProductType;
(function (ProductType) {
    ProductType["SIMPLE"] = "simple";
    ProductType["VARIATION"] = "variations";
})(ProductType || (ProductType = {}));
const merge = (arr1, arr2) => {
    let i = 0, j = 0;
    const len1 = arr1.length, len2 = arr2.length;
    const res = [];
    while (i < len1 && j < len2) {
        if (arr1[i].stock <= arr2[j].stock) {
            res.push(arr1[i]);
            ++i;
        }
        else {
            res.push(arr2[j]);
            ++j;
        }
    }
    while (i < len1) {
        res.push(arr1[i++]);
    }
    while (j < len2) {
        res.push(arr2[j++]);
    }
    return res;
};
const index = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        let find = {
            deleted: false,
        };
        const keyword = req.query.keyword;
        find = Object.assign(Object.assign({}, find), { $or: [
                { title: { $regex: keyword, $options: "si" } },
                { slug: { $regex: keyword, $options: "si" } },
                { shortDescription: { $regex: keyword, $options: "si" } },
                { SKU: { $regex: keyword, $options: "si" } },
            ] });
        const totalRecord = yield product_model_1.default.countDocuments(find);
        const initObjectPagination = {
            page: 1,
            limitItems: totalRecord,
        };
        if (req.query.limit) {
            initObjectPagination.limitItems = Number(req.query.limit);
        }
        const objectPagination = (0, pagination_1.default)(initObjectPagination, req.query, totalRecord);
        const products = yield product_model_1.default.find(find)
            .skip(objectPagination.skip)
            .limit(objectPagination.limitItems)
            .lean();
        for (const pro of products) {
            const subProducts = yield subProduct_model_1.default.find({
                product_id: pro._id,
                deleted: false,
            });
            if (subProducts.length > 0) {
                (0, product_1.solvePriceStock)(pro, subProducts);
            }
        }
        res.json({
            code: 200,
            message: "OK",
            data: {
                products: products,
                totalRecord: totalRecord,
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
const detail = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const product_id = req.params.id;
        if (!product_id) {
            throw Error("Missing product_id!!");
        }
        const product = yield product_model_1.default.findOne({ _id: product_id });
        if (!product) {
            throw Error("Product not found!");
        }
        let subProductData = [];
        const variations = [];
        if (product.productType === "variations") {
            const subProducts = yield subProduct_model_1.default.find({
                deleted: false,
                product_id: product.id,
            }).lean();
            if (subProducts.length > 0) {
                const subMap = new Map();
                for (const item of subProducts) {
                    subMap.set(String(item._id), Object.assign({}, item));
                }
                for (const item of subProducts) {
                    const subProductOptions = yield subProductOption_model_1.default.find({
                        deleted: false,
                        sub_product_id: item._id,
                    }).lean();
                    const options = [];
                    if (subProductOptions.length === 0) {
                        subMap.set(String(item._id), null);
                    }
                    else {
                        for (const subOption of subProductOptions) {
                            const option = yield variationOption_model_1.default.findOne({
                                _id: subOption.variation_option_id,
                                deleted: false,
                            });
                            if (option) {
                                options.push({
                                    label: option.title,
                                    value: option.id,
                                    sub_product_id: item._id,
                                });
                                const variation = yield variation_model_1.default.findOne({
                                    _id: option.variation_id,
                                    deleted: false,
                                });
                                const index = variations.findIndex((item) => item._id === option.variation_id);
                                if (index !== -1) {
                                    if (!variations[index].options.find((it) => it.value === option.id)) {
                                        variations[index].options.push({
                                            value: option.id,
                                            label: option.title,
                                        });
                                    }
                                }
                                else {
                                    variations.push({
                                        _id: variation.id,
                                        options: [
                                            {
                                                value: option.id,
                                                label: option.title,
                                            },
                                        ],
                                        title: variation.title,
                                    });
                                }
                            }
                        }
                    }
                    item["options"] = options;
                    if (options.length > 0) {
                        subMap.set(String(item._id), Object.assign({}, item));
                    }
                }
                subMap.forEach((val, key) => __awaiter(void 0, void 0, void 0, function* () {
                    if (val) {
                        subProductData.push(val);
                    }
                    else {
                        yield subProduct_model_1.default.updateOne({ _id: key }, { deleted: true, deletedAt: new Date() });
                    }
                }));
            }
        }
        res.json({
            code: 200,
            message: "OK",
            data: product,
            dataSubProducts: subProductData,
            dataVariationOptions: variations,
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
exports.detail = detail;
const create = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { data, subProducts } = req.body;
        const price = data === null || data === void 0 ? void 0 : data.price;
        const stock = (data === null || data === void 0 ? void 0 : data.stock) || 0;
        const product = new product_model_1.default(Object.assign({ price: price, stock: stock }, data));
        const skus = [(data === null || data === void 0 ? void 0 : data.SKU) || ""];
        let message = "Create new success!!";
        const subs = [];
        const subOptions = [];
        if (subProducts && subProducts.length > 0) {
            for (const item of subProducts) {
                const subProduct = new subProduct_model_1.default(Object.assign({ product_id: product.id, price: (item === null || item === void 0 ? void 0 : item.price) || 0, stock: (item === null || item === void 0 ? void 0 : item.stock) || 0 }, item));
                skus.push((item === null || item === void 0 ? void 0 : item.SKU) || "");
                subs.push(subProduct);
                for (const it of item.options) {
                    const subProductOption = new subProductOption_model_1.default({
                        sub_product_id: subProduct.id,
                        variation_option_id: it,
                    });
                    subOptions.push(subProductOption);
                }
            }
            const existSkus = yield subProduct_model_1.default.find({
                SKU: { $in: skus },
                deleted: false,
            });
            for (const subProduct of subs) {
                const exist = existSkus.find((it) => it.SKU === subProduct.SKU);
                if (exist || !subProduct.SKU) {
                    message = "Create new success, but some SKU already exist!!";
                    exist.SKU = `KAKRIST-SKU-${new Date().getTime()}`;
                }
            }
        }
        const existSkus = yield product_model_1.default.find({
            SKU: { $in: skus },
            deleted: false,
        });
        if (existSkus.length > 0 || !(data === null || data === void 0 ? void 0 : data.SKU)) {
            product.SKU = `KAKRIST-SKU-${new Date().getTime()}`;
            message = "Create new success, but some SKU already exist!!";
        }
        yield Promise.all([
            product.save(),
            subProduct_model_1.default.insertMany(subs),
            subProductOption_model_1.default.insertMany(subOptions),
        ]);
        res.json({
            code: 200,
            message: message,
            data: product,
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
    var _a;
    try {
        const product_id = req.params.id;
        const product = yield product_model_1.default.findOne({ _id: product_id, deleted: false });
        if (!product) {
            throw Error("Product not found!");
        }
        const productType = req.body.productType;
        switch (productType) {
            case ProductType.SIMPLE:
                break;
            case ProductType.VARIATION:
                req.body.price = null;
                break;
            default:
                throw Error("Type of product is not correct!");
        }
        req.body.stock = ((_a = req.body) === null || _a === void 0 ? void 0 : _a.stock) || 0;
        console.log(req.body);
        yield product_model_1.default.updateOne({ _id: product_id }, req.body);
        res.json({
            code: 200,
            message: "Successfully!",
            data: {
                product_id: product_id,
            },
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
const editSubProduct = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const product_id = req.params.id;
        const subProducts = req.body.subProducts;
        const combinations = req.body.combinations;
        const product = yield product_model_1.default.findOne({ _id: product_id, deleted: false });
        if (!product) {
            throw Error("product is not found");
        }
        if (product.productType !== ProductType.VARIATION) {
            product.productType = ProductType.VARIATION;
            yield product.save();
        }
        for (const item of subProducts) {
            if (item.sub_product_id) {
                yield subProduct_model_1.default.updateOne({ _id: item.sub_product_id }, {
                    price: (item === null || item === void 0 ? void 0 : item.price) || null,
                    stock: (item === null || item === void 0 ? void 0 : item.stock) || 0,
                    thumbnail: (item === null || item === void 0 ? void 0 : item.thumbnail) || "",
                    discountedPrice: (item === null || item === void 0 ? void 0 : item.discountedPrice) || null,
                    SKU: (item === null || item === void 0 ? void 0 : item.SKU) || "",
                });
            }
        }
        const dataSubProducts = yield subProduct_model_1.default.find({
            product_id: product_id,
            deleted: false,
        });
        const keys_combination = combinations.map((item) => item
            .map((it) => it.value)
            .sort((a, b) => (a < b ? 1 : -1))
            .join("-"));
        for (const item of dataSubProducts) {
            const subOptions = yield subProductOption_model_1.default.find({
                sub_product_id: item.id,
                deleted: false,
            });
            const key = subOptions
                .map((sop) => sop.variation_option_id)
                .sort((a, b) => (a < b ? 1 : -1))
                .join("-");
            if (keys_combination.includes(key)) {
                const index = keys_combination.findIndex((item) => item === key);
                if (index !== -1) {
                    keys_combination.splice(index, 1);
                }
            }
            else {
                const ids = subOptions.map((sop) => sop.id);
                yield subProductOption_model_1.default.deleteMany({ _id: { $in: ids } });
                yield subProduct_model_1.default.updateOne({ _id: item._id }, { deleted: true, deletedAt: new Date() });
            }
        }
        for (const item of keys_combination) {
            const newSubProduct = new subProduct_model_1.default({ product_id: product_id });
            const options = item.split("-");
            for (const opt of options) {
                const subProductOption = new subProductOption_model_1.default({
                    variation_option_id: opt,
                    sub_product_id: newSubProduct.id,
                });
                yield subProductOption.save();
            }
            yield newSubProduct.save();
        }
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
exports.editSubProduct = editSubProduct;
const getPriceProduct = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const products = yield product_model_1.default.find({ deleted: false });
    let min = 0, max = 0;
    const ids = products.map((pro) => pro.id);
    const subProducts = yield subProduct_model_1.default.find({
        product_id: { $in: ids },
        deleted: false,
    });
    max = Math.max(...products.map((pro) => pro.price));
    max = Math.max(...subProducts.map((sub) => sub.price));
    res.json({
        code: 200,
        message: "GET PRICE OK!",
        data: {
            min: min,
            max: max,
        },
    });
});
exports.getPriceProduct = getPriceProduct;
const filterProduct = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const keyword = req.query.keyword || "";
        const categories = req.body.categories || [];
        const productType = req.body.productType || "";
        const price = req.body.price;
        let find = {
            deleted: false,
        };
        if (keyword) {
            find = Object.assign(Object.assign({}, find), { $or: [
                    { title: { $regex: keyword, $options: "si" } },
                    { slug: { $regex: keyword, $options: "si" } },
                    { shortDescription: { $regex: keyword, $options: "si" } },
                    { SKU: { $regex: keyword, $options: "si" } },
                ] });
        }
        if (categories.length > 0) {
            find["categories"] = { $all: categories };
        }
        if (productType) {
            find["productType"] = productType;
        }
        let totalRecord = yield product_model_1.default.countDocuments(find);
        const initObjectPagination = {
            page: 1,
            limitItems: totalRecord,
        };
        if (req.query.limit) {
            initObjectPagination.limitItems = Number(req.query.limit);
        }
        const objectPagination = (0, pagination_1.default)(initObjectPagination, req.query, totalRecord);
        let data = [];
        if (price) {
            const products = yield product_model_1.default.find(find).lean();
            const skip = objectPagination.skip;
            const limit = objectPagination.limitItems;
            const ids = products.map((item) => item._id);
            const subProducts = yield subProduct_model_1.default.find({
                $and: [
                    { deleted: false },
                    { product_id: { $in: ids } },
                    { price: { $gte: price[0] } },
                    { price: { $lte: price[1] } },
                ],
            });
            const subSet = new Set([...subProducts.map((item) => item.product_id)]);
            const allSubs = yield subProduct_model_1.default.find({
                $and: [{ deleted: false }, { product_id: { $in: ids } }],
            }).lean();
            const subMap = new Map();
            for (const item of allSubs) {
                if (!subMap.has(item.product_id)) {
                    subMap.set(item.product_id, [Object.assign({}, item)]);
                }
                else {
                    const arr = subMap.get(item.product_id);
                    arr.push(Object.assign({}, item));
                    subMap.set(item.product_id, [...arr]);
                }
            }
            for (const product of products) {
                if (product.productType === "variations") {
                    if (subSet.has(String(product._id))) {
                        const allSubs = subMap.get(String(product._id));
                        (0, product_1.solvePriceStock)(product, allSubs);
                        data.push(product);
                    }
                }
                else {
                    if (product.price >= price[0] && product.price <= price[1]) {
                        data.push(product);
                    }
                }
            }
            const response = [];
            totalRecord = data.length;
            for (let i = skip; i < Math.min(limit + skip, data.length); i++) {
                response.push(data[i]);
            }
            res.json({
                code: 200,
                message: "OK",
                data: {
                    products: response,
                    totalRecord: totalRecord,
                },
            });
            return;
        }
        else {
            const products = yield product_model_1.default.find(find)
                .lean()
                .skip(objectPagination.skip)
                .limit(objectPagination.limitItems);
            for (const product of products) {
                if (product.productType === "variations") {
                    const subProducts = yield subProduct_model_1.default.find({
                        $and: [{ deleted: false, product_id: product._id }],
                    });
                    if (subProducts.length > 0) {
                        (0, product_1.solvePriceStock)(product, subProducts);
                    }
                }
                data.push(product);
            }
        }
        res.json({
            code: 200,
            message: "OK",
            data: {
                products: data,
                totalRecord: totalRecord,
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
exports.filterProduct = filterProduct;
const remove = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const product_id = req.params.id;
        if (!product_id) {
            throw Error("Missing product_id");
        }
        const product = yield product_model_1.default.findOne({ _id: product_id, deleted: false });
        if (!product) {
            throw Error("Product not found!");
        }
        const subProducts = yield subProduct_model_1.default.find({
            product_id: product.id,
            deleted: false,
        });
        if (subProducts.length > 0) {
            const ids = subProducts.map((item) => item.id);
            yield subProductOption_model_1.default.deleteMany({ sub_product_id: { $in: ids } });
            yield subProduct_model_1.default.updateMany({ product_id: { $in: [product_id] } }, { deleted: true, deletedAt: new Date() });
        }
        product.deleted = true;
        product.deletedAt = new Date();
        yield product.save();
        res.json({
            code: 200,
            message: "Deleted!",
            data: [],
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
const removeSubProduct = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const sub_product_id = req.params.id;
        if (!sub_product_id) {
            throw Error("Missing sub_product_id!!");
        }
        const subProduct = yield subProduct_model_1.default.findOne({ _id: sub_product_id });
        if (!subProduct) {
            throw Error("Not found!!");
        }
        yield subProductOption_model_1.default.deleteMany({
            sub_product_id: { $in: [subProduct.id] },
        });
        subProduct.deleted = true;
        subProduct.deletedAt = new Date();
        yield subProduct.save();
        res.json({
            code: 200,
            message: "Deleted",
        });
    }
    catch (error) {
        res.json({
            code: 400,
            message: error.message || error,
        });
    }
});
exports.removeSubProduct = removeSubProduct;
const changeMulti = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const action = req.body.action;
        const payload = req.body.payload;
        switch (action) {
            case "delete-all":
                const subProducts = yield subProduct_model_1.default.find({
                    product_id: { $in: payload },
                    deleted: false,
                });
                const ids = subProducts.map((sub) => sub.id);
                yield subProductOption_model_1.default.deleteMany({ sub_product_id: { $in: ids } });
                yield subProduct_model_1.default.updateMany({ _id: { $in: ids } }, { deleted: true, deletedAt: new Date() });
                yield product_model_1.default.updateMany({ _id: { $in: payload } }, { deleted: true, deletedAt: new Date() });
                break;
            default:
                throw Error("Action not correct!");
        }
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
exports.changeMulti = changeMulti;
const getAllSKU = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const products = yield product_model_1.default.find({ deleted: false }).select("SKU _id title");
        res.json({
            code: 200,
            message: "OK!",
            data: products,
        });
    }
    catch (error) {
        res.json({
            code: 400,
            message: error.message || error,
        });
    }
});
exports.getAllSKU = getAllSKU;
const productsSKU = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const ids = req.body.ids;
        const products = yield product_model_1.default.find({
            _id: { $in: ids },
            deleted: false,
        }).lean();
        const subProducts = yield subProduct_model_1.default.find({
            product_id: { $in: ids },
            deleted: false,
        }).lean();
        const subIds = subProducts.map((item) => String(item._id));
        const subOptions = yield subProductOption_model_1.default.find({
            sub_product_id: { $in: subIds },
            deleted: false,
        }).lean();
        const optionsIds = subOptions.map((item) => item.variation_option_id);
        const options = yield variationOption_model_1.default.find({ _id: { $in: optionsIds } });
        const subOptMap = new Map();
        for (const subOption of subOptions) {
            if (subOptMap.has(subOption.sub_product_id)) {
                const value = subOptMap.get(subOption.sub_product_id);
                value.push(subOption.variation_option_id);
                subOptMap.set(subOption.sub_product_id, value);
            }
            else
                subOptMap.set(subOption.sub_product_id, [
                    subOption.variation_option_id,
                ]);
        }
        for (const sub of subProducts) {
            const opts = subOptMap.get(String(sub._id));
            const options_info = opts.map((item) => {
                const it = options.find((o) => o.id === item);
                return it.title;
            });
            sub["options"] = options_info;
        }
        for (const item of products) {
            if (item.productType === "variations") {
                const subs = subProducts.filter((it) => it.product_id === String(item._id));
                item["subProducts"] = subs;
            }
        }
        res.json({
            code: 200,
            message: "OK!",
            data: products,
        });
    }
    catch (error) {
        res.json({
            code: 400,
            message: error.message || error,
        });
    }
});
exports.productsSKU = productsSKU;
const topSell = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { products, products_info } = yield (0, product_1.getTopSellHelper)(req);
        res.json({
            code: 200,
            message: "OK",
            data: {
                products,
                products_info,
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
exports.topSell = topSell;
const lowQuantity = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        let find = {
            deleted: false,
        };
        const products = yield product_model_1.default.find(find);
        const subProducts = yield subProduct_model_1.default.find(find)
            .sort({ stock: "asc" })
            .lean();
        yield (0, product_1.solveOptionSubProduct)(subProducts);
        let simpleProduct = products.filter((item) => item.productType === "simple");
        simpleProduct = simpleProduct.sort((a, b) => a.stock - b.stock);
        let response = merge(simpleProduct, subProducts);
        const totalRecord = response.length;
        const initObjectPagination = {
            page: 1,
            limitItems: totalRecord,
        };
        if (req.query.limit) {
            initObjectPagination.limitItems = Number(req.query.limit);
        }
        const objPagination = (0, pagination_1.default)(initObjectPagination, req.query, totalRecord);
        const skip = objPagination.skip;
        const data = [];
        for (let i = skip; i < Math.min(totalRecord, skip + objPagination.limitItems); i++) {
            const item = response[i];
            if (item.product_id) {
                const product = products.find((it) => it.id === item.product_id);
                if (product) {
                    item.thumbnailProduct = product.thumbnail;
                    item.title = product.title;
                    item.productType = ProductType.VARIATION;
                }
            }
            data.push(item);
        }
        res.json({
            code: 200,
            message: "OK",
            data: data,
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
exports.lowQuantity = lowQuantity;
const testSocket = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { message } = req.body;
        const io = (0, socket_1.getIo)();
        io.emit("SERVER_RETURN_TEST", { message });
        res.json({
            code: 200,
            message: "OK",
            data: {
                message: `Received message: ${message}`,
            },
        });
    }
    catch (error) {
        res.json({
            code: 400,
            message: error.message || error,
        });
    }
});
exports.testSocket = testSocket;
