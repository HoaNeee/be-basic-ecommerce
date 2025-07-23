"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
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
exports.getCategoryTopSell = exports.getDataReport = void 0;
const dateHelper = __importStar(require("../../../helpers/getDate"));
const order_model_1 = __importDefault(require("../../models/order.model"));
const purchaseOrder_model_1 = __importDefault(require("../../models/purchaseOrder.model"));
const subProduct_model_1 = __importDefault(require("../../models/subProduct.model"));
const product_model_1 = __importDefault(require("../../models/product.model"));
const category_model_1 = __importDefault(require("../../models/category.model"));
const pagination_1 = __importDefault(require("../../../helpers/pagination"));
const groupBy_1 = require("../../../helpers/groupBy");
const getDataReport = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const [startMonth, endMonth] = dateHelper.getStartEnd("month");
        const [startYear, endYear] = dateHelper.getStartEnd("year");
        const orders = yield order_model_1.default.find({ deleted: false });
        const po = yield purchaseOrder_model_1.default.find({ deleted: false });
        const cost = po.reduce((val, item) => {
            return val + item.totalCost;
        }, 0);
        const revenue = orders.reduce((val, item) => {
            return val + item.totalPrice;
        }, 0);
        const profit = revenue - cost;
        const findMonth = {
            deleted: false,
            createdAt: { $gte: startMonth, $lt: endMonth },
        };
        const findYear = {
            deleted: false,
            createdAt: { $gte: startYear, $lt: endYear },
        };
        const promises = yield Promise.all([
            yield order_model_1.default.find(findMonth),
            yield purchaseOrder_model_1.default.find(findMonth),
            yield order_model_1.default.find(findYear),
            yield purchaseOrder_model_1.default.find(findYear),
        ]);
        const [ordersOfMonth, poOfMonth, ordersOfYear, poOfYear] = promises;
        const profitOfMonth = ordersOfMonth.reduce((val, item) => val + item.totalPrice, 0) -
            poOfMonth.reduce((val, item) => val + item.totalCost, 0);
        const profitOfYear = ordersOfYear.reduce((val, item) => val + item.totalPrice, 0) -
            poOfYear.reduce((val, item) => val + item.totalCost, 0);
        res.json({
            code: 200,
            message: "OK",
            data: {
                totalProfit: profit,
                cost,
                revenue,
                sales: orders.length,
                profitOfMonth,
                profitOfYear,
            },
        });
    }
    catch (error) {
        res.json({
            code: 400,
            message: error.message,
        });
    }
});
exports.getDataReport = getDataReport;
const paginationHelper = (data, req, totalRecord, initLimit) => {
    const initPagination = {
        page: 1,
        limitItems: initLimit || totalRecord,
    };
    if (req.query.limit) {
        initPagination.limitItems = Number(req.query.limit);
    }
    const objPagination = (0, pagination_1.default)(initPagination, req.query, totalRecord);
    const skip = objPagination.skip;
    const res = [];
    for (let i = skip; i < Math.min(totalRecord, skip + objPagination.limitItems); i++) {
        res.push(data[i]);
    }
    return res;
};
const getCategoryTopSell = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const orders = yield order_model_1.default.find({ deleted: false });
        const skus = [];
        const priceMap = new Map();
        for (const order of orders) {
            const products = order.products;
            for (const product of products) {
                skus.push(product.SKU);
                priceMap.set(product.SKU, priceMap.get(product.SKU) + product.price || product.price);
            }
        }
        const qtyMap = new Map();
        for (const sku of skus) {
            qtyMap.set(sku, qtyMap.get(sku) + 1 || 1);
        }
        const subProducts = yield subProduct_model_1.default.find({
            deleted: false,
            SKU: { $in: skus },
        });
        const idsProduct = subProducts.map((item) => item.product_id);
        const subMap = (0, groupBy_1.groupByArray)(subProducts, "product_id");
        const products = yield product_model_1.default.find({
            deleted: false,
            $or: [{ SKU: { $in: skus } }, { _id: { $in: idsProduct } }],
        });
        const catsMap = new Map();
        for (const product of products) {
            let curr_quantiy = 0;
            let curr_totalPrice = 0;
            if (product.productType === "variations") {
                const subs = subMap.get(product.id);
                for (const sub of subs) {
                    const qty = qtyMap.get(sub.SKU) || 0;
                    const price = priceMap.get(sub.SKU) || 0;
                    curr_quantiy += qty;
                    curr_totalPrice += price;
                }
            }
            else {
                const qty = qtyMap.get(product.SKU) || 0;
                const price = priceMap.get(product.SKU) || 0;
                curr_quantiy += qty;
                curr_totalPrice += price;
            }
            const cateIds = product.categories;
            for (const cat_id of cateIds) {
                if (!catsMap.has(cat_id)) {
                    catsMap.set(cat_id, {
                        quantity: curr_quantiy,
                        totalPrice: curr_totalPrice,
                    });
                }
                else {
                    let { quantity, totalPrice } = catsMap.get(cat_id);
                    quantity += curr_quantiy;
                    totalPrice += curr_totalPrice;
                    catsMap.set(cat_id, { quantity, totalPrice });
                }
            }
        }
        const categories = yield category_model_1.default.find({
            deleted: false,
            _id: { $in: [...catsMap.keys()] },
        });
        let data = [];
        for (const cate of categories) {
            const { quantity, totalPrice } = catsMap.get(cate.id);
            data.push(Object.assign(Object.assign({}, cate.toObject()), { quantity,
                totalPrice }));
        }
        data = [...data.sort((a, b) => b.quantity - a.quantity)];
        if (!req.query.page && !req.query.limit) {
            res.json({
                code: 200,
                message: "OK",
                data,
            });
            return;
        }
        const totalRecord = data.length;
        const response = paginationHelper(data, req, totalRecord, 4);
        res.json({
            code: 200,
            message: "OK",
            data: response,
        });
    }
    catch (error) {
        res.json({
            code: 400,
            message: error.message,
        });
    }
});
exports.getCategoryTopSell = getCategoryTopSell;
