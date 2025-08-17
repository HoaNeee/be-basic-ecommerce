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
exports.bulkEmbedProduct = exports.changeIndexed = exports.getAllProductID = exports.syncEmbedTime = exports.deleteEmbedProduct = exports.getProductNotEmbeded = exports.getEmbedStatistic = exports.getEmbedSubProduct = exports.syncEmbedProduct = exports.getEmbedProduct = exports.embedProduct = exports.changeSubProductTrashAll = exports.changeTrashAll = exports.bulkChangeSubProductTrash = exports.bulkChangeTrash = exports.changeSubproductTrashOne = exports.changeTrashOne = exports.trashSubProducts = exports.trashProducts = exports.lowQuantity = exports.topSell = exports.productsSKU = exports.getAllSKU = exports.changeMulti = exports.removeSubProduct = exports.remove = exports.filterProduct = exports.getPriceProduct = exports.editSubProduct_v2 = exports.edit = exports.create = exports.detail_v2 = exports.products = void 0;
const pagination_1 = __importDefault(require("../../../helpers/pagination"));
const subProduct_model_1 = __importDefault(require("../../models/subProduct.model"));
const subProductOption_model_1 = __importDefault(require("../../models/subProductOption.model"));
const product_model_1 = __importDefault(require("../../models/product.model"));
const variation_model_1 = __importDefault(require("../../models/variation.model"));
const variationOption_model_1 = __importDefault(require("../../models/variationOption.model"));
const product_1 = require("../../../utils/product");
const purchaseOrder_model_1 = __importDefault(require("../../models/purchaseOrder.model"));
const supplier_model_1 = __importDefault(require("../../models/supplier.model"));
const AIAssistant_controller_1 = require("../admin/AIAssistant.controller");
const database_1 = require("../../../configs/database");
const embedProduct_model_1 = __importDefault(require("../../models/embedProduct.model"));
const constant_1 = require("../../../helpers/constant");
const uuid_1 = require("uuid");
const syncEmbedTime_1 = __importDefault(require("../../models/syncEmbedTime"));
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
const products = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
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
            .sort({ createdAt: -1 })
            .lean();
        const product_ids = products.map((item) => String(item._id));
        const subProducts = yield subProduct_model_1.default.find({
            product_id: { $in: product_ids },
            deleted: false,
        });
        for (const pro of products) {
            const subs = subProducts.filter((item) => String(item.product_id) === String(pro._id));
            if (subs.length > 0) {
                (0, product_1.solvePriceStock)(pro, subs);
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
exports.products = products;
const detail_v2 = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
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
                const sub_product_ids = subProducts.map((item) => String(item._id));
                const sub_options = yield subProductOption_model_1.default.find({
                    deleted: false,
                    sub_product_id: { $in: sub_product_ids },
                }).lean();
                const option_ids = sub_options.map((item) => String(item.variation_option_id));
                const variation_option_ids = yield variationOption_model_1.default.find({
                    _id: { $in: option_ids },
                    deleted: false,
                });
                const variation_ids = variation_option_ids.map((item) => String(item.variation_id));
                const variationsData = yield variation_model_1.default.find({
                    _id: { $in: variation_ids },
                    deleted: false,
                });
                for (const item of subProducts) {
                    const subProductOptions = sub_options.filter((opt) => String(opt.sub_product_id) === String(item._id));
                    const options = [];
                    if (subProductOptions.length === 0) {
                        subMap.set(String(item._id), null);
                    }
                    else {
                        for (const subOption of subProductOptions) {
                            const option = variation_option_ids.find((opt) => String(opt._id) === String(subOption.variation_option_id));
                            if (option) {
                                options.push({
                                    label: option.title,
                                    value: option.id,
                                    sub_product_id: item._id,
                                });
                                const variation = variationsData.find((item) => item.id === option.variation_id);
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
exports.detail_v2 = detail_v2;
const create = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { data, subProducts } = req.body;
        const price = data === null || data === void 0 ? void 0 : data.price;
        const stock = (data === null || data === void 0 ? void 0 : data.stock) || 0;
        const product = new product_model_1.default(Object.assign({ price: price, stock: stock }, data));
        const skus = [(data === null || data === void 0 ? void 0 : data.SKU) || ""];
        let message = "Create new success";
        const prefix_SKU = `KAKRIST-SKU`;
        const subs = [];
        const subOptions = [];
        const pos = [];
        let exist_pos = false;
        if (subProducts && subProducts.length > 0) {
            for (const item of subProducts) {
                const subProduct = new subProduct_model_1.default(Object.assign({ product_id: product.id, price: Number((item === null || item === void 0 ? void 0 : item.price) || 0), stock: Number((item === null || item === void 0 ? void 0 : item.stock) || 0), cost: Number((item === null || item === void 0 ? void 0 : item.cost) || 0) }, item));
                const createPurchaseOrder = (item === null || item === void 0 ? void 0 : item.createPurchaseOrder) || false;
                if (createPurchaseOrder) {
                    if (exist_pos) {
                        const po = pos[0];
                        const products = po.products;
                        products.push({
                            ref_id: subProduct.id,
                            SKU: subProduct.SKU || "",
                            quantity: subProduct.stock,
                            unitCost: subProduct.cost,
                        });
                        po.products = products;
                        po.totalCost = products.reduce((acc, curr) => acc + curr.unitCost * curr.quantity, 0);
                    }
                    else {
                        const po = new purchaseOrder_model_1.default({
                            products: [
                                {
                                    ref_id: subProduct.id,
                                    SKU: subProduct.SKU || "",
                                    quantity: subProduct.stock,
                                    unitCost: subProduct.cost,
                                },
                            ],
                            supplier_id: (data === null || data === void 0 ? void 0 : data.supplier_id) || "",
                            expectedDelivery: new Date(new Date().getTime() + 5 * 24 * 60 * 60 * 1000),
                            totalCost: subProduct.stock * subProduct.cost,
                            typePurchase: "initial",
                        });
                        pos.push(po);
                    }
                    exist_pos = true;
                }
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
                    subProduct.SKU = `${prefix_SKU}-${(Date.now() +
                        Math.random() * 1000).toFixed(0)}`;
                }
            }
        }
        const existSkus = yield product_model_1.default.find({
            SKU: { $in: skus },
            deleted: false,
        });
        if (existSkus.length > 0 || !(data === null || data === void 0 ? void 0 : data.SKU)) {
            product.SKU = `${prefix_SKU}-${(Date.now() +
                Math.random() * 1000).toFixed(0)}`;
            message = "Create new success, but some SKU already exist!!";
        }
        yield Promise.all([
            product.save(),
            subProduct_model_1.default.insertMany(subs),
            subProductOption_model_1.default.insertMany(subOptions),
            purchaseOrder_model_1.default.insertMany(pos),
        ]);
        const isEmbedding = (data === null || data === void 0 ? void 0 : data.isEmbedding) || false;
        if (isEmbedding) {
            yield (0, AIAssistant_controller_1.embedingProduct)(product, subs, subOptions);
        }
        else {
            syncEmbedProductData({
                id: String(product._id),
                action: "update",
                type: "one",
            });
        }
        const createPurchaseOrder = (data === null || data === void 0 ? void 0 : data.createPurchaseOrder) || false;
        if (product.productType === ProductType.SIMPLE) {
            if (createPurchaseOrder) {
                const po = new purchaseOrder_model_1.default({
                    products: [
                        {
                            ref_id: product.id,
                            SKU: product.SKU || "",
                            quantity: product.stock,
                            unitCost: product.cost || 0,
                        },
                    ],
                    supplier_id: (data === null || data === void 0 ? void 0 : data.supplier_id) || "",
                    expectedDelivery: new Date(new Date().getTime() + 5 * 24 * 60 * 60 * 1000),
                    totalCost: Number(product.stock * (product.cost || 0)),
                    typePurchase: "initial",
                });
                yield po.save();
            }
        }
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
                req.body.price = req.body.price || 0;
                break;
            case ProductType.VARIATION:
                req.body.price = null;
                break;
            default:
                throw Error("Type of product is not correct!");
        }
        req.body.stock = ((_a = req.body) === null || _a === void 0 ? void 0 : _a.stock) || 0;
        yield syncEmbedProductData({
            id: String(product._id),
            action: "update",
            type: "one",
        });
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
const editSubProduct_v2 = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const product_id = req.params.id;
        const subProducts = req.body.subProducts;
        const combinations = req.body.combinations;
        if (!product_id) {
            res.status(400).json({
                code: 400,
                message: "Product ID is required",
            });
            return;
        }
        const prefix_SKU = `KAKRIST-SKU`;
        const [product] = yield Promise.all([
            product_model_1.default.findOne({ _id: product_id, deleted: false }),
            syncEmbedProductData({
                id: product_id,
                action: "update",
                type: "one",
            }),
        ]);
        if (!product) {
            throw Error("product is not found");
        }
        if (product.productType !== ProductType.VARIATION) {
            product.productType = ProductType.VARIATION;
            yield product.save();
        }
        const update_sub_exist = [];
        for (const item of subProducts) {
            if (item.sub_product_id) {
                update_sub_exist.push(subProduct_model_1.default.updateOne({ _id: item.sub_product_id }, {
                    price: item === null || item === void 0 ? void 0 : item.price,
                    stock: (item === null || item === void 0 ? void 0 : item.stock) || 0,
                    thumbnail: (item === null || item === void 0 ? void 0 : item.thumbnail) || "",
                    discountedPrice: (item === null || item === void 0 ? void 0 : item.discountedPrice) || null,
                    SKU: (item === null || item === void 0 ? void 0 : item.SKU) ||
                        `${prefix_SKU}-${(Date.now() + Math.random() * 1000).toFixed(0)}`,
                }));
            }
        }
        yield Promise.all(update_sub_exist);
        const dataSubProducts = yield subProduct_model_1.default.find({
            product_id: product_id,
            deleted: false,
        });
        const keys_combination = combinations.map((item) => item
            .map((it) => it.value)
            .sort((a, b) => (a < b ? 1 : -1))
            .join("-"));
        const subProductOptions = yield subProductOption_model_1.default.find({
            sub_product_id: { $in: dataSubProducts.map((item) => item.id) },
            deleted: false,
        });
        const sub_product_need_delete = [];
        for (const item of dataSubProducts) {
            const subOptions = subProductOptions.filter((opt) => String(opt.sub_product_id) === String(item._id));
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
                sub_product_need_delete.push(item.id);
            }
        }
        if (sub_product_need_delete.length > 0) {
            yield subProduct_model_1.default.updateMany({ _id: { $in: sub_product_need_delete } }, { deleted: true, deletedAt: new Date() });
        }
        const new_sub_products = [];
        const new_sub_product_options = [];
        for (const item of keys_combination) {
            const newSubProduct = new subProduct_model_1.default({
                product_id: product_id,
                SKU: `${prefix_SKU}-${(Date.now() + Math.random() * 1000).toFixed(0)}`,
            });
            const options = item.split("-");
            for (const opt of options) {
                const subProductOption = new subProductOption_model_1.default({
                    variation_option_id: opt,
                    sub_product_id: newSubProduct.id,
                });
                new_sub_product_options.push(subProductOption);
            }
            new_sub_products.push(newSubProduct);
        }
        if (new_sub_products.length > 0) {
            yield subProduct_model_1.default.insertMany(new_sub_products);
            yield subProductOption_model_1.default.insertMany(new_sub_product_options);
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
exports.editSubProduct_v2 = editSubProduct_v2;
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
            const [subProducts, allSubs] = yield Promise.all([
                subProduct_model_1.default.find({
                    $and: [
                        { deleted: false },
                        { product_id: { $in: ids } },
                        { price: { $gte: price[0] } },
                        { price: { $lte: price[1] } },
                    ],
                }),
                subProduct_model_1.default.find({
                    $and: [{ deleted: false }, { product_id: { $in: ids } }],
                }).lean(),
            ]);
            const subSet = new Set([...subProducts.map((item) => item.product_id)]);
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
            const subProducts = yield subProduct_model_1.default.find({
                $and: [
                    { deleted: false },
                    { product_id: { $in: products.map((item) => item._id) } },
                ],
            });
            for (const product of products) {
                if (product.productType === "variations") {
                    const subs = subProducts.filter((item) => String(item.product_id) === String(product._id));
                    if (subs.length > 0) {
                        (0, product_1.solvePriceStock)(product, subs);
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
            yield subProductOption_model_1.default.updateMany({ sub_product_id: { $in: ids } }, { deleted: true, deletedAt: new Date() });
            yield subProduct_model_1.default.updateMany({ product_id: { $in: [product_id] } }, { deleted: true, deletedAt: new Date() });
        }
        product.deleted = true;
        product.deletedAt = new Date();
        yield Promise.all([
            product.save(),
            syncEmbedProductData({
                id: String(product._id),
                action: "delete",
                type: "one",
            }),
        ]);
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
        yield subProductOption_model_1.default.updateMany({
            sub_product_id: { $in: [subProduct.id] },
        }, {
            deleted: true,
            deletedAt: new Date(),
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
                yield subProductOption_model_1.default.updateMany({ sub_product_id: { $in: ids } }, { deleted: true, deletedAt: new Date() });
                yield subProduct_model_1.default.updateMany({ _id: { $in: ids } }, { deleted: true, deletedAt: new Date() });
                yield syncEmbedProductData({
                    ids: payload,
                    action: "delete",
                    type: "many",
                });
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
const trashProducts = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        let find = {
            deleted: true,
        };
        const keyword = req.query.keyword || "";
        if (keyword) {
            find.$or = [
                { title: { $regex: keyword, $options: "si" } },
                { SKU: { $regex: keyword, $options: "si" } },
            ];
        }
        const initPagination = {
            page: 1,
            limitItems: 10,
        };
        if (req.query.limit) {
            initPagination.limitItems = Number(req.query.limit);
        }
        const totalRecord = yield product_model_1.default.countDocuments(find);
        const pagination = (0, pagination_1.default)(initPagination, req.query, totalRecord);
        const products = yield product_model_1.default.aggregate([
            { $match: find },
            {
                $addFields: {
                    product_id_string: { $toString: "$_id" },
                    categories_object_ids: {
                        $map: {
                            input: "$categories",
                            as: "category",
                            in: { $toObjectId: "$$category" },
                        },
                    },
                },
            },
            {
                $lookup: {
                    from: "sub-products",
                    localField: "product_id_string",
                    foreignField: "product_id",
                    as: "subProducts",
                },
            },
            {
                $lookup: {
                    from: "categories",
                    localField: "categories_object_ids",
                    foreignField: "_id",
                    as: "categories_info",
                    pipeline: [{ $project: { title: 1 } }],
                },
            },
            {
                $set: {
                    count_sub_product: { $size: "$subProducts" },
                },
            },
            { $unset: ["subProducts"] },
            { $skip: pagination.skip },
            { $limit: pagination.limitItems },
        ]);
        const supplier_ids = products
            .filter((it) => it.supplier_id)
            .map((item) => item.supplier_id);
        const suppliers = yield supplier_model_1.default.find({ _id: { $in: supplier_ids } });
        for (const product of products) {
            const supplier = suppliers.find((it) => it._id === product.supplier_id);
            if (supplier) {
                product.supplierName = supplier.name;
            }
            else {
                product.supplierName = "Unknown";
            }
        }
        res.json({
            code: 200,
            message: "OK",
            data: {
                products,
                totalRecord,
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
exports.trashProducts = trashProducts;
const trashSubProducts = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        let find = {
            deleted: true,
        };
        const keyword = req.query.keyword || "";
        if (keyword) {
            find.$or = [
                { title: { $regex: keyword, $options: "si" } },
                { SKU: { $regex: keyword, $options: "si" } },
            ];
            const product = yield product_model_1.default.find(find);
            if (product && product.length > 0) {
                find.product_id = { $in: product.map((item) => item._id) };
            }
            else {
                find.product_id = { $in: [] };
            }
        }
        const initPagination = {
            page: 1,
            limitItems: 10,
        };
        if (req.query.limit) {
            initPagination.limitItems = Number(req.query.limit);
        }
        const totalRecord = yield subProduct_model_1.default.countDocuments(find);
        const pagination = (0, pagination_1.default)(initPagination, req.query, totalRecord);
        const subProducts = yield subProduct_model_1.default.find(find)
            .sort({ createdAt: "desc" })
            .skip((pagination.page - 1) * pagination.limitItems)
            .limit(pagination.limitItems)
            .lean();
        const product_ids = subProducts.map((item) => item.product_id);
        const sub_ids = subProducts.map((item) => String(item._id));
        const [subOptions, products] = yield Promise.all([
            subProductOption_model_1.default.find({
                sub_product_id: { $in: sub_ids },
            }),
            product_model_1.default.find({
                _id: { $in: product_ids },
            }),
        ]);
        const options = yield variationOption_model_1.default.find({
            _id: { $in: subOptions.map((item) => item.variation_option_id) },
        });
        for (const sub of subProducts) {
            const product = products.find((it) => it.id === sub.product_id);
            if (product) {
                sub["thumbnail_product"] = product.thumbnail;
                sub["title"] = product.title;
            }
            const subOpts = subOptions.filter((item) => item.sub_product_id === String(sub._id));
            if (subOpts && subOpts.length) {
                const opts = options.filter((item) => subOpts
                    .map((subOpt) => subOpt.variation_option_id)
                    .includes(String(item._id)));
                if (opts && opts.length) {
                    sub["options"] = opts;
                }
            }
        }
        res.json({
            code: 200,
            message: "OK",
            data: {
                subProducts,
                totalRecord,
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
exports.trashSubProducts = trashSubProducts;
const changeTrashOne = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const product_id = req.params.productId;
        const type = req.query.type;
        const checkedSubProduct = req.body.checkedSubProduct;
        return yield changeTrashOneHelper(product_id, type, checkedSubProduct, req, res, product_model_1.default, true);
    }
    catch (error) {
        res.json({
            code: 400,
            message: error.message || error,
        });
    }
});
exports.changeTrashOne = changeTrashOne;
const changeSubproductTrashOne = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const sub_id = req.params.subId;
        const type = req.query.type;
        return yield changeTrashOneHelper(sub_id, type, false, req, res, subProduct_model_1.default, false);
    }
    catch (error) {
        res.status(400).json({
            code: 400,
            message: error.message || error,
        });
    }
});
exports.changeSubproductTrashOne = changeSubproductTrashOne;
const bulkChangeTrash = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const action = req.query.action;
        const ids = req.body.ids;
        const checkedSubProduct = req.body.checkedSubProduct;
        return yield bulkChangeHelper(ids, action, checkedSubProduct, req, res, product_model_1.default, "product");
    }
    catch (error) {
        res.json({
            code: 400,
            message: error.message || error,
        });
    }
});
exports.bulkChangeTrash = bulkChangeTrash;
const bulkChangeSubProductTrash = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const action = req.query.action;
        const ids = req.body.ids;
        return yield bulkChangeHelper(ids, action, false, req, res, subProduct_model_1.default, "subProduct");
    }
    catch (error) {
        res.json({
            code: 400,
            message: error.message || error,
        });
    }
});
exports.bulkChangeSubProductTrash = bulkChangeSubProductTrash;
const changeTrashAll = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const action = req.query.action;
        const checkedSubProduct = req.body.checkedSubProduct;
        const products = yield product_model_1.default.find({
            deleted: true,
        });
        yield syncEmbedProductData({
            ids: products.map((item) => String(item._id)),
            action: action === "restore" ? "update" : "delete",
            type: "many",
        });
        return yield changeTrashAllHelper(action, checkedSubProduct, req, res, product_model_1.default, "product");
    }
    catch (error) {
        res.json({
            code: 400,
            message: error.message || error,
        });
    }
});
exports.changeTrashAll = changeTrashAll;
const changeSubProductTrashAll = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const action = req.query.action;
        return yield changeTrashAllHelper(action, false, req, res, subProduct_model_1.default, "subProduct");
    }
    catch (error) {
        res.json({
            code: 400,
            message: error.message || error,
        });
    }
});
exports.changeSubProductTrashAll = changeSubProductTrashAll;
const embedProduct = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const product_id = req.params.productId;
        const type = req.query.type;
        if (type === "delete") {
            yield deleteEmbedHelper(product_id);
            res.status(200).json({
                code: 200,
                message: "Delete product successfully",
            });
            yield embedProduct_model_1.default.deleteOne({ product_id });
            return;
        }
        yield embedProductHelper(res, product_id);
        yield embedProduct_model_1.default.deleteOne({ product_id });
        res.status(200).json({
            code: 200,
            message: "Embed product successfully",
        });
    }
    catch (error) {
        res.status(500).json({
            code: 500,
            message: error.message || error,
        });
    }
});
exports.embedProduct = embedProduct;
const getEmbedProduct = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const qdrantClient = (0, database_1.getQdrantClient)();
        let limit = 10;
        let next_page_offset = "";
        if (req.query.limit) {
            limit = parseInt(req.query.limit) || 10;
        }
        if (req.query.next_page_offset) {
            next_page_offset = req.query.next_page_offset;
        }
        const collection = yield qdrantClient.scroll("products", {
            limit: limit,
            offset: next_page_offset || 0,
            with_payload: true,
        });
        res.status(200).json({
            code: 200,
            message: "successfully!",
            data: {
                products: collection.points.map((item) => {
                    return Object.assign({ vector_id: item.id, vector: item.vector }, item.payload);
                }),
                next_page_offset: collection.next_page_offset,
            },
        });
    }
    catch (error) {
        res.status(500).json({
            code: 500,
            message: error.message || error,
        });
    }
});
exports.getEmbedProduct = getEmbedProduct;
const syncEmbedProduct = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const vector_id = req.params.vector_id;
        const collection_name = req.query.collection_name;
        if (!vector_id) {
            res.status(400).json({
                code: 400,
                message: "Vector ID is required",
            });
            return;
        }
        const qdrantClient = (0, database_1.getQdrantClient)();
        const records = yield qdrantClient.retrieve(collection_name, {
            ids: [vector_id],
        });
        let record = records[0].payload;
        const product_id = collection_name === "products" ? record._id : record.product_id;
        const [product, subProducts] = yield Promise.all([
            product_model_1.default.findOne({
                _id: product_id,
                deleted: false,
            }).lean(),
            subProduct_model_1.default.find({
                product_id: product_id,
                deleted: false,
            }).lean(),
        ]);
        const subOptions = yield subProductOption_model_1.default.find({
            sub_product_id: { $in: subProducts.map((item) => String(item._id)) },
            deleted: false,
        }).lean();
        if (product && subProducts.length > 0 && subOptions.length > 0) {
            yield (0, AIAssistant_controller_1.embedingProduct)(product, subProducts, subOptions);
        }
        const newRecord = yield qdrantClient.retrieve(collection_name, {
            ids: [vector_id],
        });
        record = newRecord[0].payload;
        res.status(200).json({
            code: 200,
            message: "Sync Successfully!",
            data: record,
        });
    }
    catch (error) {
        console.log(error);
        res.status(500).json({
            code: 500,
            message: error.message || error,
        });
    }
});
exports.syncEmbedProduct = syncEmbedProduct;
const getEmbedSubProduct = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const qdrantClient = (0, database_1.getQdrantClient)();
        let limit = 10;
        let next_page_offset = "";
        if (req.query.limit) {
            limit = parseInt(req.query.limit) || 10;
        }
        if (req.query.next_page_offset) {
            next_page_offset = req.query.next_page_offset;
        }
        const collection = yield qdrantClient.scroll("sub-products", {
            limit: limit,
            offset: next_page_offset || 0,
            with_payload: true,
            with_vector: false,
        });
        res.status(200).json({
            code: 200,
            message: "successfully!",
            data: {
                subProducts: collection.points.map((item) => {
                    return Object.assign({ vector_id: item.id }, item.payload);
                }),
                next_page_offset: collection.next_page_offset,
            },
        });
    }
    catch (error) {
        res.status(500).json({
            code: 500,
            message: error.message || error,
        });
    }
});
exports.getEmbedSubProduct = getEmbedSubProduct;
const getEmbedStatistic = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const qdrantClient = (0, database_1.getQdrantClient)();
        const sub_collection = yield qdrantClient.getCollection("sub-products");
        const total_vectors_sub_products = sub_collection.points_count;
        const subProduct = yield qdrantClient.scroll("sub-products", {
            limit: 1,
            with_payload: true,
            with_vector: false,
        });
        let payload = {};
        if (subProduct.points.length > 0) {
            payload = subProduct.points[0].payload;
        }
        const object = yield getProductNotEmbedHelper();
        const sync_time = yield syncEmbedTime_1.default.findOne({ type_sync: "product" });
        res.status(200).json({
            code: 200,
            message: "successfully!",
            data: {
                total_vectors: object.total_vectors,
                total_vectors_sub_products,
                pending_embeddings: object.product_not_embedded.length,
                pending_sync: object.product_need_sync.length,
                last_sync: sync_time ? sync_time.sync_time : null,
                payload_schema_product: object.payload_schema_product,
                payload_schema_sub_product: Object.assign(Object.assign({}, payload), { payload_schema: sub_collection.payload_schema }),
            },
        });
    }
    catch (error) {
        res.status(500).json({
            code: 500,
            message: error.message || error,
        });
    }
});
exports.getEmbedStatistic = getEmbedStatistic;
const getProductNotEmbeded = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const object = yield getProductNotEmbedHelper();
        res.status(200).json({
            code: 200,
            message: "successfully!",
            data: {
                product_not_embedded: object.product_not_embedded,
                product_need_sync: object.product_need_sync,
            },
        });
    }
    catch (error) {
        res.status(500).json({
            code: 500,
            message: error.message || error,
        });
    }
});
exports.getProductNotEmbeded = getProductNotEmbeded;
const deleteEmbedProduct = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const vector_id = req.params.vector_id;
        const collection_name = req.query.collection_name;
        const qdrantClient = (0, database_1.getQdrantClient)();
        if (collection_name === "products") {
            const records = yield qdrantClient.retrieve("products", {
                ids: [vector_id],
                with_payload: true,
                with_vector: false,
            });
            const product_id = records[0].payload._id;
            yield deleteEmbedHelper(product_id);
        }
        else {
            yield qdrantClient.delete(collection_name, {
                points: [vector_id],
            });
        }
        res.status(200).json({
            code: 200,
            message: "Deleted Embedding Successfully!",
        });
    }
    catch (error) {
        console.log(error);
        res.status(500).json({
            code: 500,
            message: error.message || error,
        });
    }
});
exports.deleteEmbedProduct = deleteEmbedProduct;
const syncEmbedTime = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const type_sync = req.body.type_sync;
        const record = yield syncEmbedTime_1.default.findOne({ type_sync });
        if (!record) {
            yield syncEmbedTime_1.default.insertOne({
                type_sync,
                sync_time: new Date(),
            });
        }
        else {
            record.sync_time = new Date();
            yield record.save();
        }
        res.status(200).json({
            code: 200,
            message: "Sync Time Successfully!",
        });
    }
    catch (error) {
        console.log(error);
        res.status(500).json({
            code: 500,
            message: error.message || error,
        });
    }
});
exports.syncEmbedTime = syncEmbedTime;
const getAllProductID = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const products = yield product_model_1.default.find({ deleted: false }, { _id: 1, title: 1 }).lean();
        res.status(200).json({
            code: 200,
            message: "Get All Product IDs Successfully!",
            data: products,
        });
    }
    catch (error) {
        console.log(error);
        res.status(500).json({
            code: 500,
            message: error.message || error,
        });
    }
});
exports.getAllProductID = getAllProductID;
const changeIndexed = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const payload = req.body.payload || [];
        const payload_product = payload.filter((it) => it.product_type === "product");
        const payload_sub_product = payload.filter((it) => it.product_type === "sub-product");
        const qdrantClient = (0, database_1.getQdrantClient)();
        const promises = [];
        for (const item of payload_sub_product) {
            const key = item.key;
            if (item.checked) {
                promises.push(qdrantClient.createPayloadIndex("sub-products", {
                    field_name: key,
                    field_schema: item.data_type,
                }));
            }
            else {
                promises.push(qdrantClient.deletePayloadIndex("sub-products", key));
            }
        }
        for (const item of payload_product) {
            const key = item.key;
            if (item.checked) {
                promises.push(qdrantClient.createPayloadIndex("products", {
                    field_name: key,
                    field_schema: item.data_type,
                }));
            }
            else {
                promises.push(qdrantClient.deletePayloadIndex("products", key));
            }
        }
        yield Promise.all(promises);
        res.status(200).json({
            code: 200,
            message: "Change Indexed Successfully!",
        });
    }
    catch (error) {
        console.log(error);
        res.status(500).json({
            code: 500,
            message: error.message || error,
        });
    }
});
exports.changeIndexed = changeIndexed;
const bulkEmbedProduct = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const vector_ids = req.body.vector_ids;
        const collection_name = req.query.collection_name;
        if (!vector_ids || vector_ids.length === 0) {
            res.status(400).json({
                code: 400,
                message: "Vector IDs are required",
            });
            return;
        }
        const qdrantClient = (0, database_1.getQdrantClient)();
        if (collection_name === "products") {
            const records = yield (0, database_1.getQdrantClient)().retrieve("products", {
                ids: vector_ids,
                with_payload: true,
                with_vector: false,
            });
            const product_ids = records.map((item) => item.payload._id);
            yield Promise.all(product_ids.map((id) => qdrantClient.delete("sub-products", {
                filter: {
                    must: [
                        {
                            key: "product_id",
                            match: { value: id },
                        },
                    ],
                },
            })));
        }
        yield qdrantClient.delete(collection_name, {
            points: vector_ids,
        });
        res.status(200).json({
            code: 200,
            message: "Deleted Embedding Successfully!",
        });
    }
    catch (error) {
        console.log(error);
        res.status(500).json({
            code: 500,
            message: error.message || error,
        });
    }
});
exports.bulkEmbedProduct = bulkEmbedProduct;
const embedProductHelper = (res, product_id) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (!product_id) {
            res.status(400).json({
                code: 400,
                message: "Product ID is required",
            });
            return;
        }
        const product = yield product_model_1.default.findOne({ _id: product_id, deleted: false });
        if (!product) {
            res.status(404).json({
                code: 404,
                message: "Product not found",
            });
            return;
        }
        const subProducts = yield subProduct_model_1.default.find({
            product_id,
            deleted: false,
        }).lean();
        const sub_ids = subProducts.map((item) => String(item._id));
        const subOptions = yield subProductOption_model_1.default.find({
            sub_product_id: { $in: sub_ids },
            deleted: false,
        }).lean();
        yield (0, AIAssistant_controller_1.embedingProduct)(product, subProducts, subOptions);
    }
    catch (error) {
        throw error;
    }
});
const getProductNotEmbedHelper = () => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const qdrantClient = (0, database_1.getQdrantClient)();
        const collection = yield qdrantClient.getCollection("products");
        const total_vectors = collection.points_count;
        const records = yield qdrantClient.scroll("products", {
            limit: total_vectors,
            with_payload: true,
            with_vector: false,
        });
        let payload = {};
        if (records.points.length > 0) {
            payload = records.points[0].payload;
        }
        const embedProductData = yield embedProduct_model_1.default.find({});
        const embedProductIds = embedProductData.map((item) => item.product_id);
        const product_ids = records.points.map((item) => item.payload._id);
        const [product_not_embedded, product_need_sync] = yield Promise.all([
            product_model_1.default.find({
                _id: { $nin: product_ids },
                deleted: false,
            })
                .select("title thumbnail SKU")
                .lean(),
            product_model_1.default.find({
                _id: { $in: embedProductIds },
            })
                .select("title thumbnail SKU")
                .lean(),
        ]);
        return {
            total_vectors,
            product_not_embedded: product_not_embedded.map((item) => (Object.assign(Object.assign({}, item), { type: "update" }))),
            product_need_sync: product_need_sync.map((item) => {
                const it = embedProductData.find((e) => e.product_id === String(item._id));
                return Object.assign(Object.assign({}, item), { type: it.type });
            }),
            payload_schema_product: Object.assign(Object.assign({}, payload), { payload_schema: collection.payload_schema }),
        };
    }
    catch (error) {
        throw error;
    }
});
const changeTrashOneHelper = (id, type, checkedSubProduct, req, res, Model, isProduct) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (!id) {
            res.status(400).json({
                code: 400,
                message: "Product ID is required",
            });
            return;
        }
        const record = yield Model.findOne({ _id: id, deleted: true });
        if (!record) {
            res.status(404).json({
                code: 404,
                message: "Product not found",
            });
            return;
        }
        if (isProduct) {
            yield syncEmbedProductData({
                id,
                action: type === "restore" ? "update" : "delete",
                type: "one",
            });
        }
        if (type === "restore") {
            record.deleted = false;
            delete record.deletedAt;
            if (checkedSubProduct &&
                isProduct &&
                record.productType === "variations") {
                const subProducts = yield subProduct_model_1.default.find({
                    product_id: record._id,
                    deleted: true,
                });
                yield Promise.all([
                    subProductOption_model_1.default.updateMany({ sub_product_id: { $in: subProducts.map((item) => item._id) } }, { deleted: false }),
                    subProduct_model_1.default.updateMany({ _id: { $in: subProducts.map((item) => item._id) } }, { deleted: false }),
                ]);
            }
            yield record.save();
        }
        else if (type === "delete") {
            if (checkedSubProduct &&
                isProduct &&
                record.productType === "variations") {
                const subProducts = yield subProduct_model_1.default.find({ product_id: record._id });
                yield Promise.all([
                    subProductOption_model_1.default.deleteMany({
                        sub_product_id: { $in: subProducts.map((item) => item._id) },
                    }),
                    subProduct_model_1.default.deleteMany({
                        _id: { $in: subProducts.map((item) => item._id) },
                    }),
                ]);
            }
            yield Model.deleteOne({ _id: id });
        }
        res.json({
            code: 200,
            message: `${type === "restore" ? "Restored" : "Deleted"} Successfully`,
        });
    }
    catch (error) {
        throw error;
    }
});
const bulkChangeHelper = (ids_1, action_1, checkedSubProduct_1, req_1, res_1, Model_1, ...args_1) => __awaiter(void 0, [ids_1, action_1, checkedSubProduct_1, req_1, res_1, Model_1, ...args_1], void 0, function* (ids, action, checkedSubProduct, req, res, Model, type = "product") {
    try {
        if (!ids || !Array.isArray(ids) || ids.length === 0) {
            res.status(400).json({
                code: 400,
                message: "Product IDs are required",
            });
            return;
        }
        const records = yield Model.find({ _id: { $in: ids }, deleted: true });
        if (!records || records.length === 0) {
            res.status(404).json({
                code: 404,
                message: "No products found",
            });
            return;
        }
        if (type === "product") {
            syncEmbedProductData({
                ids,
                action: action === "restore" ? "update" : "delete",
                type: "many",
            });
        }
        if (action === "restore") {
            yield Model.updateMany({ _id: { $in: ids } }, { deleted: false });
            if (checkedSubProduct && type === "product") {
                const subProducts = yield subProduct_model_1.default.find({
                    product_id: { $in: ids },
                    deleted: true,
                });
                yield Promise.all([
                    subProductOption_model_1.default.updateMany({ sub_product_id: { $in: subProducts.map((item) => item._id) } }, { deleted: false }),
                    subProduct_model_1.default.updateMany({ _id: { $in: subProducts.map((item) => item._id) } }, { deleted: false }),
                ]);
            }
        }
        else if (action === "delete") {
            yield Model.deleteMany({ _id: { $in: ids } });
            if (checkedSubProduct && type === "product") {
                const subProducts = yield subProduct_model_1.default.find({ product_id: { $in: ids } });
                yield Promise.all([
                    subProductOption_model_1.default.deleteMany({
                        sub_product_id: { $in: subProducts.map((item) => item._id) },
                    }),
                    subProduct_model_1.default.deleteMany({
                        _id: { $in: subProducts.map((item) => item._id) },
                    }),
                ]);
            }
        }
        res.json({
            code: 200,
            message: `${action === "restore" ? "Restored" : "Deleted"} Successfully`,
        });
    }
    catch (error) {
        console.log(error);
        throw error;
    }
});
const changeTrashAllHelper = (action_1, checkedSubProduct_1, req_1, res_1, Model_1, ...args_1) => __awaiter(void 0, [action_1, checkedSubProduct_1, req_1, res_1, Model_1, ...args_1], void 0, function* (action, checkedSubProduct, req, res, Model, type = "product") {
    try {
        if (action === "restore") {
            yield Model.updateMany({ deleted: true }, { deleted: false, deletedAt: null });
            if (checkedSubProduct && type === "product") {
                yield Promise.all([
                    subProductOption_model_1.default.updateMany({ deleted: true }, { deleted: false, deletedAt: null }),
                    subProduct_model_1.default.updateMany({ deleted: true }, { deleted: false, deletedAt: null }),
                ]);
            }
        }
        else if (action === "delete") {
            yield Model.deleteMany({ deleted: true });
            if (checkedSubProduct && type === "product") {
                yield Promise.all([
                    subProductOption_model_1.default.deleteMany({ deleted: true }),
                    subProduct_model_1.default.deleteMany({ deleted: true }),
                ]);
            }
        }
        res.json({
            code: 200,
            message: `${action === "restore" ? "Restored" : "Deleted"} Successfully`,
        });
    }
    catch (error) {
        console.log(error);
        throw error;
    }
});
const syncEmbedProductData = (_a) => __awaiter(void 0, [_a], void 0, function* ({ ids, id, action, type, }) {
    try {
        if (type === "many") {
            const exists = yield embedProduct_model_1.default.find({
                product_id: { $in: ids },
            });
            const exist_ids = exists.map((item) => String(item.product_id));
            if (exists.length > 0) {
                yield embedProduct_model_1.default.updateMany({
                    _id: { $in: exists.map((item) => item._id) },
                }, {
                    type: action,
                });
            }
            else {
                const new_ids = ids.filter((id) => !exist_ids.includes(id));
                yield embedProduct_model_1.default.insertMany(new_ids.map((id) => ({
                    product_id: id,
                    type: action,
                })));
            }
        }
        else {
            const exist = yield embedProduct_model_1.default.findOne({ product_id: id });
            if (exist) {
                yield embedProduct_model_1.default.updateOne({ product_id: id }, { type: action });
            }
            else {
                yield embedProduct_model_1.default.insertOne({
                    product_id: id,
                    type: action,
                });
            }
        }
    }
    catch (error) {
        throw error;
    }
});
const deleteEmbedHelper = (product_id) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (!product_id) {
            throw new Error("Product ID is required");
        }
        const NAMESPACE = constant_1.NAMESPACE_UUID;
        const product_uuid = (0, uuid_1.v5)(product_id, NAMESPACE);
        const subProducts = yield subProduct_model_1.default.find({ product_id });
        const sub_uuids = subProducts.map((item) => (0, uuid_1.v5)(String(item._id), NAMESPACE));
        const qdrantClient = (0, database_1.getQdrantClient)();
        yield Promise.all([
            qdrantClient.delete("products", {
                points: [product_uuid],
            }),
            qdrantClient.delete("sub-products", {
                points: sub_uuids,
            }),
        ]);
    }
    catch (error) {
        throw error;
    }
});
