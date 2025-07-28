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
exports.getDataChart2 = exports.getDataChart = exports.statistic = exports.detail = exports.changeStatus = exports.index = void 0;
const pagination_1 = __importDefault(require("../../../helpers/pagination"));
const order_model_1 = __importDefault(require("../../models/order.model"));
const cart_model_1 = __importDefault(require("../../models/cart.model"));
const cartDetail_model_1 = __importDefault(require("../../models/cartDetail.model"));
const dateHelper = __importStar(require("../../../helpers/getDate"));
const purchase_controller_1 = require("./purchase.controller");
const customer_model_1 = __importDefault(require("../../models/customer.model"));
const order_1 = require("../../../utils/order");
const notification_model_1 = __importDefault(require("../../models/notification.model"));
const product_model_1 = __importDefault(require("../../models/product.model"));
const subProduct_model_1 = __importDefault(require("../../models/subProduct.model"));
const socket_1 = require("../../../socket");
const index = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        let find = {
            deleted: false,
        };
        let { keyword, status } = req.query;
        let from = req.query.from;
        let to = req.query.to;
        const sortQuery = req.query.sort;
        const sort = {};
        if (sortQuery) {
            const sorts = sortQuery.split("-");
            sort[`${sorts[0]}`] = sorts[1];
        }
        if (status) {
            find["status"] = status;
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
        const customers = yield customer_model_1.default.find({
            deleted: false,
            $or: [
                { firstName: { $regex: keyword, $options: "si" } },
                { lastName: { $regex: keyword, $options: "si" } },
            ],
        })
            .select("firstName lastName avatar")
            .lean();
        find["user_id"] = {
            $in: customers.map((it) => String(it._id)),
        };
        const totalRecord = yield order_model_1.default.countDocuments(find);
        const initPagination = {
            page: 1,
            limitItems: totalRecord,
        };
        if (req.query.limit) {
            initPagination.limitItems = Number(req.query.limit);
        }
        const objPagination = (0, pagination_1.default)(initPagination, req.query, totalRecord);
        const orders = yield order_model_1.default.find(find)
            .skip(objPagination.skip)
            .limit(objPagination.limitItems)
            .sort(sort)
            .lean();
        for (const order of orders) {
            const customer = customers.find((item) => String(item._id) === order.user_id);
            if (customer) {
                order["customer"] = customer;
            }
        }
        res.json({
            code: 200,
            message: "OK",
            data: {
                orders,
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
exports.index = index;
const changeStatus = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const order_id = req.params.id;
        const { status } = req.body;
        const order = yield order_model_1.default.findOne({ _id: order_id });
        const customer = yield customer_model_1.default.findOne({ _id: order.user_id });
        if (!order) {
            throw Error("Order not found!");
        }
        if (status === "confirmed" && order.status === "pending") {
            const skus = order.products.map((item) => item.SKU);
            const products = yield product_model_1.default.find({
                SKU: { $in: skus },
                deleted: false,
            });
            const subProducts = yield subProduct_model_1.default.find({
                SKU: { $in: skus },
                deleted: false,
            });
            if (products.some((item) => item.stock <= 0) ||
                subProducts.some((item) => item.stock <= 0)) {
                throw Error("Some products are outting of stock!");
            }
            yield (0, order_1.updateStockWhenOrder)(order, "minus");
        }
        if (status === "canceled") {
            if (order.status !== "pending") {
                console.log("need update stock because this order status is canceled");
            }
            order.cancel = {
                reasonCancel: req.body.reasonCancel,
                canceledBy: req.body.canceledBy,
                canceledAt: new Date(),
            };
        }
        if (status === "delivered") {
            order.deliveredAt = new Date();
        }
        order.status = status;
        yield order.save();
        const notify1 = new notification_model_1.default({
            user_id: order.user_id,
            type: "order",
            title: (0, order_1.statusOrder)(order.status).title,
            body: (0, order_1.statusOrder)(order.status).body,
            ref_id: order.orderNo,
            ref_link: "/profile/orders",
            image: (0, order_1.statusOrder)(order.status).image,
            receiver: "customer",
        });
        yield notify1.save();
        if (customer.setting.notification || !customer.setting) {
            const io = (0, socket_1.getIo)();
            io.emit("SERVER_RETURN_CHANGE_STATUS_ORDER", {
                user_id: order.user_id,
                title: (0, order_1.statusOrder)(order.status).title,
                body: (0, order_1.statusOrder)(order.status).body,
                ref_id: order.orderNo,
                ref_link: "/profile/orders",
                image: (0, order_1.statusOrder)(order.status).image,
                message: `Your order with orderNo: ${order.orderNo} has been placed successfully!`,
            });
        }
        res.json({
            code: 200,
            message: "Status Updated!",
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
exports.changeStatus = changeStatus;
const detail = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const order_id = req.params.id;
        if (!order_id) {
            throw Error("Missing order_id!");
        }
        const order = yield order_model_1.default.findOne({ _id: order_id, deleted: false }).lean();
        const customer = yield customer_model_1.default.findOne({ _id: order.user_id })
            .select("firstName lastName avatar email")
            .lean();
        order["customer"] = customer;
        res.json({
            code: 200,
            message: "OK",
            data: order,
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
const statistic = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const orders = yield order_model_1.default.find({ deleted: false });
        const delivereds = orders.filter((item) => item.status === "delivered").length;
        let revenue = 0, cost = 0;
        for (const item of orders) {
            if (item.status !== "canceled") {
                const products = item.products;
                for (const pro of products) {
                    revenue += pro.price;
                    cost += pro.cost;
                }
            }
        }
        const carts = yield cart_model_1.default.find({ deleted: false });
        const cartIds = carts.map((item) => item.id);
        const cartItems = yield cartDetail_model_1.default.find({
            cart_id: { $in: cartIds },
            deleted: false,
        });
        const quantityInCart = cartItems.reduce((val, item) => {
            return val + item.quantity;
        }, 0);
        res.json({
            code: 200,
            message: "OK",
            data: {
                revenue,
                cost,
                sales: orders.length,
                delivereds,
                quantityInCart,
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
            const response = yield (0, purchase_controller_1.getDataChartHelper)(type, dayOfTheWeek, 7, "orders", order_model_1.default, "price");
            data = [...response];
        }
        else if (type === "monthly") {
            const thisMonth = new Date().getMonth();
            const dateOfMonth = dateHelper.dateOfMonth(thisMonth + 1);
            const dayOfTheMonth = new Date().getDate();
            const response = yield (0, purchase_controller_1.getDataChartHelper)(type, dayOfTheMonth, dateOfMonth, "orders", order_model_1.default, "price");
            data = [...response];
        }
        else {
            const response = yield (0, purchase_controller_1.getDataChartHelper)("year", 1, 12, "orders", order_model_1.default, "price");
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
const getDataChart2 = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const oneDay = 1000 * 60 * 60 * 24;
        const thisYear = new Date().getFullYear();
        const response = [];
        for (let i = 1; i <= 12; i++) {
            const start = new Date(new Date(`${i}/1/${thisYear}`).setUTCHours(0, 0, 0, 0));
            const end = new Date(new Date(`${i}/${dateHelper.dateOfMonth(i)}/${thisYear}`).setUTCHours(0, 0, 0, 0));
            const newStart = new Date(start.setDate(start.getDate() + 1));
            const newEnd = new Date(end.getTime() + oneDay * 2);
            const orders = yield order_model_1.default.find({
                $and: [
                    { deleted: false },
                    { createdAt: { $gte: newStart } },
                    { createdAt: { $lt: newEnd } },
                ],
            });
            const label = dateHelper.monthOfTheYear(i - 1, "short");
            response.push({
                name: "orders",
                label: label,
                value: orders.length,
            });
            response.push({
                name: "delivered",
                label: label,
                value: orders.filter((item) => item.status === "delivered").length,
            });
        }
        res.json({
            code: 200,
            message: "OK!",
            data: response,
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
exports.getDataChart2 = getDataChart2;
