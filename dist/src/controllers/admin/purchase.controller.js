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
exports.getDataChart = exports.statistic = exports.changeStatus = exports.create = exports.purchases = exports.getDataChartHelper = void 0;
const purchaseOrder_model_1 = __importDefault(require("../../models/purchaseOrder.model"));
const product_model_1 = __importDefault(require("../../models/product.model"));
const subProduct_model_1 = __importDefault(require("../../models/subProduct.model"));
const pagination_1 = __importDefault(require("../../../helpers/pagination"));
const dateHelper = __importStar(require("../../../helpers/getDate"));
const supplier_model_1 = __importDefault(require("../../models/supplier.model"));
const getDataChartHelper = (type, day, maxDay, name, Record, keyCost, thisYear) => __awaiter(void 0, void 0, void 0, function* () {
    const oneDay = 1000 * 60 * 60 * 24;
    const response = [];
    thisYear = thisYear || new Date().getFullYear();
    if (type === "year") {
        for (let i = day; i <= maxDay; i++) {
            const start = new Date(new Date(`${i}/1/${thisYear}`).setUTCHours(0, 0, 0, 0));
            const end = new Date(new Date(`${i}/${dateHelper.dateOfMonth(i)}/${thisYear}`).setUTCHours(0, 0, 0, 0));
            const newStart = new Date(start.setDate(start.getDate() + 1));
            const newEnd = new Date(end.getTime() + oneDay * 2);
            const records = yield Record.find({
                $and: [
                    { deleted: false },
                    { createdAt: { $gte: newStart } },
                    { createdAt: { $lt: newEnd } },
                ],
            });
            const total = records.reduce((val, item) => {
                return (val +
                    item.products.reduce((val1, it) => val1 + it[`${keyCost}`] * it.quantity, 0));
            }, 0);
            response.push({
                name: name,
                label: dateHelper.monthOfTheYear(i - 1, "short"),
                value: total,
            });
        }
        return response;
    }
    const dates = [];
    for (let i = day - 1; i >= 0; i--) {
        const date = new Date(new Date(new Date().getTime() - oneDay * i).setUTCHours(0, 0, 0, 0));
        dates.push(date);
    }
    const endDate = new Date(dates[dates.length - 1].getTime() + oneDay);
    const records = yield Record.find({
        $and: [{ createdAt: { $gte: dates[0] } }, { createdAt: { $lt: endDate } }],
    }).sort({ createAt: "asc" });
    const ordersMap = new Map();
    for (const rec of records) {
        const date = new Date(rec.createdAt).toLocaleDateString();
        const total = rec.products.reduce((val, item) => val + item.quantity * item[`${keyCost}`], 0);
        if (ordersMap.has(date)) {
            ordersMap.set(date, ordersMap.get(date) + total);
        }
        else {
            ordersMap.set(date, total);
        }
    }
    for (let i = 0; i < day; i++) {
        const date = dates[i];
        const total = ordersMap.get(date.toLocaleDateString()) || 0;
        response.push({
            name: name,
            label: type === "weekly"
                ? dateHelper.dayOfTheWeek(i, "short")
                : date.toLocaleDateString(),
            value: total,
        });
    }
    for (let i = day; i < maxDay; i++) {
        const nextDate = new Date(dates[0].getTime() + oneDay * i);
        response.push({
            name: name,
            label: type === "weekly"
                ? dateHelper.dayOfTheWeek(i, "short")
                : nextDate.toLocaleDateString(),
            value: 0,
        });
    }
    return response;
});
exports.getDataChartHelper = getDataChartHelper;
const purchases = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        let find = {
            deleted: false,
        };
        const status = req.query.status;
        const from = req.query.fromDate;
        const to = req.query.toDate;
        const keyword = req.query.keyword;
        const find_supplier = {
            deleted: false,
        };
        const find_product = {
            deleted: false,
        };
        if (keyword) {
            find_product["$or"] = [
                { SKU: { $regex: keyword, $options: "si" } },
                { title: { $regex: keyword, $options: "si" } },
            ];
            find_supplier["$or"] = [
                { name: { $regex: keyword, $options: "si" } },
                { email: { $regex: keyword, $options: "si" } },
            ];
        }
        if (Object.keys(find_supplier).length > 0) {
            const suppliers = yield supplier_model_1.default.find(find_supplier);
            find["$or"] = [
                {
                    supplier_id: {
                        $in: suppliers.map((item) => String(item._id)),
                    },
                },
            ];
        }
        if (Object.keys(find_product).length > 0) {
            const [products, subProducts] = yield Promise.all([
                product_model_1.default.find(find_product).select("SKU").lean(),
                subProduct_model_1.default.find(find_product).select("SKU").lean(),
            ]);
            const skus = [
                ...subProducts.map((item) => item.SKU),
                ...products.map((item) => item.SKU),
            ];
            find["$or"] = [
                ...find["$or"],
                {
                    "products.SKU": {
                        $in: skus,
                    },
                },
            ];
        }
        if (from && to) {
            const oneDay = 1000 * 60 * 60 * 24;
            const start = new Date(new Date(new Date(from).setUTCHours(0)).getTime() + oneDay);
            const end = new Date(new Date(new Date(to).setUTCHours(0)).getTime() + oneDay * 2);
            find = {
                $and: [
                    Object.assign({}, find),
                    { createdAt: { $gte: start } },
                    { createdAt: { $lt: end } },
                ],
            };
        }
        if (status) {
            find["status"] = status;
        }
        const totalRecord = yield purchaseOrder_model_1.default.countDocuments(find);
        const initialPagination = {
            page: 1,
            limitItems: totalRecord,
        };
        if (req.query.limit) {
            initialPagination.limitItems = Number(req.query.limit);
        }
        const objectPagination = (0, pagination_1.default)(initialPagination, req.query, totalRecord);
        const pos = yield purchaseOrder_model_1.default.find(find)
            .skip(objectPagination.skip)
            .limit(objectPagination.limitItems)
            .lean();
        const productsSKU = pos.map((item) => {
            return item.products.map((it) => it.SKU);
        });
        const ref_ids = pos
            .filter((item) => item.products.filter((it) => it.ref_id))
            .map((it) => it.products.map((i) => i.ref_id));
        const flatArr = productsSKU.flat();
        const flat_ref_ids = ref_ids.flat();
        const subProducts = yield subProduct_model_1.default.find({
            $or: [{ SKU: { $in: flatArr } }, { _id: { $in: flat_ref_ids } }],
            deleted: false,
        });
        const productIds = subProducts.map((item) => item.product_id);
        const products = yield product_model_1.default.find({
            $and: [
                {
                    $or: [
                        { _id: { $in: flat_ref_ids } },
                        { _id: { $in: productIds } },
                        { SKU: { $in: flatArr } },
                    ],
                },
                { deleted: false },
            ],
        })
            .select("title SKU price")
            .lean();
        const suppliers = yield supplier_model_1.default.find(find_supplier)
            .select("name email")
            .lean();
        for (const po of pos) {
            const templateProduct = products.find((item) => {
                const it = po.products.find((i) => i.SKU === item.SKU || i.ref_id === String(item._id));
                return it;
            });
            po["supplierName"] =
                ((_a = suppliers.find((item) => String(item._id) === String(po.supplier_id))) === null || _a === void 0 ? void 0 : _a.name) || "Unknown Supplier";
            if (templateProduct) {
                po["templateProduct"] = templateProduct;
            }
            else {
                const sub = subProducts.find((item) => {
                    const it = po.products.find((i) => i.SKU === item.SKU || i.ref_id === String(item._id));
                    if (it) {
                        return item;
                    }
                });
                if (sub) {
                    const product = products.find((item) => String(item._id) === sub.product_id);
                    if (product) {
                        po["templateProduct"] = product;
                    }
                }
            }
        }
        res.json({
            code: 200,
            message: "OK",
            data: {
                purchase_orders: pos,
                totalRecord: totalRecord,
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
exports.purchases = purchases;
const create = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const body = req.body;
        const po = new purchaseOrder_model_1.default(body);
        po.totalCost = po.products.reduce((val, item) => val + item.quantity * item.unitCost, 0);
        yield po.save();
        res.json({
            code: 200,
            message: "Created success!",
            data: po,
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
exports.create = create;
const changeStatus = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const po_id = req.params.id;
        const { status } = req.body;
        if (!po_id) {
            throw Error("Missing _id");
        }
        if (status === "received") {
            const po = yield purchaseOrder_model_1.default.findOne({ _id: po_id, deleted: false });
            const productsSKU = po.products;
            const skus = productsSKU.map((item) => item.SKU);
            const products = yield product_model_1.default.find({
                SKU: { $in: skus },
                deleted: false,
            });
            const subProducts = yield subProduct_model_1.default.find({
                SKU: { $in: skus },
                deleted: false,
            });
            for (const item of productsSKU) {
                const quantity = item.quantity;
                const cost = item.unitCost;
                const product = products.find((it) => it.SKU === item.SKU);
                const subProduct = subProducts.find((it) => it.SKU === item.SKU);
                if (product) {
                    product.stock += quantity;
                    product.cost = cost;
                    yield product.save();
                }
                else if (subProduct) {
                    subProduct.stock += quantity;
                    subProduct.cost = cost;
                    yield subProduct.save();
                }
            }
            const receivedAt = new Date();
            po.receivedAt = receivedAt;
            po.status = status;
            yield po.save();
            res.json({
                code: 200,
                message: "Success!",
            });
            return;
        }
        yield purchaseOrder_model_1.default.updateOne({ _id: po_id }, {
            status: status,
        });
        res.json({
            code: 200,
            message: "Success!",
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
exports.changeStatus = changeStatus;
const statistic = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { from, to } = req.query;
        let find = {
            deleted: false,
        };
        if (from && to) {
            find = {
                $and: [
                    Object.assign({}, find),
                    { createdAt: { $gte: from } },
                    { createdAt: { $lte: to } },
                ],
            };
        }
        const pos = yield purchaseOrder_model_1.default.find(find);
        const received = pos.filter((item) => item.status === "received");
        const canceled = pos.filter((item) => item.status === "canceled");
        const delivering = pos.filter((item) => item.status === "delivering");
        res.json({
            code: 200,
            message: "OK",
            data: {
                totalOrders: pos,
                received,
                canceled,
                delivering,
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
exports.statistic = statistic;
const getDataChart = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const type = req.query.type;
        let data = [];
        if (type === "weekly") {
            const dayOfTheWeek = new Date().getDay();
            const response = yield (0, exports.getDataChartHelper)(type, dayOfTheWeek, 7, "purchase", purchaseOrder_model_1.default, "unitCost");
            data = [...response];
        }
        else if (type === "monthly") {
            const thisMonth = new Date().getMonth();
            const dateOfMonth = dateHelper.dateOfMonth(thisMonth + 1);
            const dayOfTheMonth = new Date().getDate();
            const response = yield (0, exports.getDataChartHelper)(type, dayOfTheMonth, dateOfMonth, "purchase", purchaseOrder_model_1.default, "unitCost");
            data = [...response];
        }
        else {
            const response = yield (0, exports.getDataChartHelper)("year", 1, 12, "purchase", purchaseOrder_model_1.default, "unitCost");
            data = [...response];
        }
        res.json({
            code: 200,
            message: "OK",
            data: data,
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
exports.getDataChart = getDataChart;
