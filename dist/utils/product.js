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
exports.getTopSellHelper = exports.solveOptionSubProduct = exports.solvePriceStock = void 0;
const pagination_1 = __importDefault(require("../helpers/pagination"));
const category_model_1 = __importDefault(require("../src/models/category.model"));
const order_model_1 = __importDefault(require("../src/models/order.model"));
const product_model_1 = __importDefault(require("../src/models/product.model"));
const subProduct_model_1 = __importDefault(require("../src/models/subProduct.model"));
const subProductOption_model_1 = __importDefault(require("../src/models/subProductOption.model"));
const variationOption_model_1 = __importDefault(require("../src/models/variationOption.model"));
var ProductType;
(function (ProductType) {
    ProductType["SIMPLE"] = "simple";
    ProductType["VARIATION"] = "variations";
})(ProductType || (ProductType = {}));
const solvePriceStock = (product, subProducts) => __awaiter(void 0, void 0, void 0, function* () {
    let min = Infinity, max = 0, stock = 0;
    for (const sub of subProducts) {
        stock += sub.stock;
        min = Math.min(min, sub.price);
        max = Math.max(max, sub.price);
    }
    product[`rangePrice`] = {
        min: min,
        max: max,
    };
    product[`rangeStock`] = stock;
});
exports.solvePriceStock = solvePriceStock;
const solveOptionSubProduct = (subProducts, key) => __awaiter(void 0, void 0, void 0, function* () {
    const subIds = subProducts.map((it) => String(it._id));
    const subOptions = yield subProductOption_model_1.default.find({
        sub_product_id: { $in: subIds },
        deleted: false,
    });
    const subOptionIds = subOptions.map((it) => it.variation_option_id);
    const options = yield variationOption_model_1.default.find({ _id: { $in: subOptionIds } });
    const subOptionMap = new Map();
    for (const subOption of subOptions) {
        const opt = options.find((it) => it.id === subOption.variation_option_id);
        if (subOptionMap.has(subOption.sub_product_id)) {
            const options_info = subOptionMap.get(subOption.sub_product_id);
            options_info.push({
                title: opt.title,
                value: opt.id,
            });
        }
        else {
            subOptionMap.set(subOption.sub_product_id, [
                {
                    title: opt.title,
                    value: opt.id,
                },
            ]);
        }
    }
    for (const sub of subProducts) {
        const options_info = subOptionMap.get(String(sub._id));
        sub[key || "options_info"] = options_info;
    }
});
exports.solveOptionSubProduct = solveOptionSubProduct;
const getTopSellHelper = (req, limit) => __awaiter(void 0, void 0, void 0, function* () {
    let find = {
        deleted: false,
    };
    const orders = yield order_model_1.default.find(find);
    const productMap = new Map();
    for (const order of orders) {
        const products = order.products;
        for (const product of products) {
            const sku = product.SKU;
            if (sku) {
                if (productMap.has(sku)) {
                    const obj = productMap.get(sku);
                    obj.soldQuantity += product.quantity;
                    productMap.set(sku, Object.assign({}, obj));
                }
                else {
                    productMap.set(sku, {
                        soldQuantity: product.quantity,
                        orderedPrice: product.price,
                        SKU: product.SKU,
                        options: product.options,
                        title: product.title,
                    });
                }
            }
        }
    }
    const skus = [...productMap.keys()];
    const subProducts = yield subProduct_model_1.default.find({
        deleted: false,
        SKU: { $in: skus },
    });
    const products = yield product_model_1.default.find({
        deleted: false,
    })
        .select("-createdAt -updateAt")
        .lean();
    let response = [];
    for (const product of products) {
        const sku = product.SKU;
        const obj = productMap.get(sku);
        if (obj) {
            productMap.set(sku, Object.assign(Object.assign(Object.assign({}, product), obj), { remaining: product.stock, product_id: String(product._id) }));
        }
    }
    for (const sub of subProducts) {
        const sku = sub.SKU;
        const obj = productMap.get(sku);
        if (obj) {
            const product = products.find((it) => String(it._id) === sub.product_id);
            productMap.set(sku, Object.assign(Object.assign(Object.assign({}, product), obj), { remaining: sub.stock, product_id: sub.product_id }));
        }
    }
    productMap.forEach((val, key) => {
        response.push(val);
    });
    response = response.sort((a, b) => b.soldQuantity - a.soldQuantity);
    const totalRecord = response.length;
    const initObjectPagination = {
        page: 1,
        limitItems: limit || totalRecord,
    };
    if (req.query.limit) {
        initObjectPagination.limitItems = Number(req.query.limit);
    }
    const objPagination = (0, pagination_1.default)(initObjectPagination, req.query, totalRecord);
    const skip = objPagination.skip;
    const newResponse = [];
    const products_info = [];
    const map = new Map();
    for (let i = skip; i < Math.min(totalRecord, skip + objPagination.limitItems); i++) {
        const item = response[i];
        const categories_info = yield category_model_1.default.find({
            _id: { $in: item.categories },
            deleted: false,
        }).lean();
        item["categories_info"] = categories_info;
        newResponse.push(item);
        if (!map.has(item.product_id)) {
            if (item.productType === ProductType.VARIATION) {
                const subProducts = yield subProduct_model_1.default.find({
                    deleted: false,
                    product_id: item.product_id,
                });
                (0, exports.solvePriceStock)(item, subProducts);
            }
            products_info.push(item);
            map.set(item.product_id, true);
        }
    }
    if (products_info.length < objPagination.limitItems) {
        const len = objPagination.limitItems - products_info.length;
        let i = 0, curr_len = 0;
        const ids = [...map.keys()];
        while (curr_len < len) {
            while (ids.includes(String(products[i]._id))) {
                ++i;
            }
            ids.push(String(products[i]._id));
            if (products[i].productType === ProductType.VARIATION) {
                const subProducts = yield subProduct_model_1.default.find({
                    product_id: String(products[i]._id),
                });
                (0, exports.solvePriceStock)(products[i], subProducts);
            }
            products_info.push(products[i]);
            ++curr_len;
        }
    }
    return {
        products: newResponse,
        products_info: products_info,
        totalRecord,
        totalPage: objPagination.totalPage,
    };
});
exports.getTopSellHelper = getTopSellHelper;
