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
exports.statusOrder = exports.updateStockWhenOrder = void 0;
const product_model_1 = __importDefault(require("../src/models/product.model"));
const subProduct_model_1 = __importDefault(require("../src/models/subProduct.model"));
const updateStockWhenOrder = (order, type) => __awaiter(void 0, void 0, void 0, function* () {
    const skus = order.products.map((item) => item.SKU);
    const product_ids = order.products.map((i) => i.product_id);
    const sub_product_ids = order.products.map((i) => i.sub_product_id);
    const products = yield product_model_1.default.find({
        $or: [{ SKU: { $in: skus } }, { _id: { $in: product_ids } }],
        deleted: false,
    });
    const subProducts = yield subProduct_model_1.default.find({
        $or: [{ SKU: { $in: skus } }, { _id: { $in: sub_product_ids } }],
        deleted: false,
    });
    let direc = 1;
    if (type === "minus") {
        direc = -1;
    }
    for (const product of order.products) {
        const sku = product.SKU;
        const quantity = product.quantity * direc;
        if (product.options && product.options.length > 0) {
            const sub = subProducts.find((it) => it.SKU === sku);
            if (sub) {
                sub.stock += quantity;
                yield sub.save();
            }
        }
        else {
            const pro = products.find((it) => it.SKU === sku);
            if (pro) {
                pro.stock += quantity;
                yield pro.save();
            }
        }
    }
});
exports.updateStockWhenOrder = updateStockWhenOrder;
const statusOrder = (status) => {
    switch (status) {
        case "pending":
            return {
                image: "https://res.cloudinary.com/dlogl1cn7/image/upload/v1752983399/icons8-box-64_1_m2qysd.png",
                title: "",
                body: "",
            };
        case "confirmed":
            return {
                image: "https://res.cloudinary.com/dlogl1cn7/image/upload/v1752937812/icons8-hand-box-64_atuazm.png",
                title: "Your order has been " + status,
                body: "Please check and confirm your order.",
            };
        case "shipping":
            return {
                image: "https://res.cloudinary.com/dlogl1cn7/image/upload/v1752937813/icons8-shipping-48_dbdmat.png",
                title: "Your order is " + status,
                body: "Your order is being shipped to you.",
            };
        case "delivered":
            return {
                image: "https://res.cloudinary.com/dlogl1cn7/image/upload/v1752937812/icons8-delivered-64_q7woyx.png",
                title: "Your order has been " + status,
                body: "Thank you for buying our products.",
            };
        case "canceled":
            return {
                image: "https://res.cloudinary.com/dlogl1cn7/image/upload/v1752937812/icons8-box-48_zlu6wl.png",
                title: "Your order has been " + status,
                body: "We sincerely apologize for the bad experience.",
            };
        default:
            return {
                image: "https://res.cloudinary.com/dlogl1cn7/image/upload/v1752983399/icons8-box-64_1_m2qysd.png",
                title: "",
                body: "",
            };
    }
};
exports.statusOrder = statusOrder;
