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
exports.remove = exports.changeSubProduct = exports.updateQuantity = exports.addProduct = exports.getCart = void 0;
const cart_model_1 = __importDefault(require("../../models/cart.model"));
const cartDetail_model_1 = __importDefault(require("../../models/cartDetail.model"));
const subProduct_model_1 = __importDefault(require("../../models/subProduct.model"));
const product_model_1 = __importDefault(require("../../models/product.model"));
const variationOption_model_1 = __importDefault(require("../../models/variationOption.model"));
const getCart = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const user_id = req.userId;
        let cart = yield cart_model_1.default.findOne({ user_id: user_id }).select("-deleted -deletedAt");
        if (!cart) {
            cart = new cart_model_1.default({
                user_id: user_id,
            });
            yield cart.save();
            res.status(200).json({
                code: 200,
                message: "Cart OK",
                data: {
                    carts: [],
                    cart_id: cart.id,
                },
            });
            return;
        }
        const cartItems = yield cartDetail_model_1.default.find({ cart_id: cart.id }).lean();
        const productIds = cartItems.map((item) => item.product_id);
        const subIds = cartItems.map((item) => item.sub_product_id);
        const products = yield product_model_1.default.find({
            _id: { $in: productIds },
        });
        const subProducts = yield subProduct_model_1.default.find({
            _id: { $in: subIds },
        });
        const data = [];
        for (const item of cartItems) {
            const indexProduct = products.findIndex((pro) => pro.id === item.product_id);
            item["cartItem_id"] = item._id;
            if (indexProduct !== -1) {
                item["thumbnail"] = products[indexProduct].thumbnail;
                item["title"] = products[indexProduct].title;
                item["slug"] = products[indexProduct].slug;
                item["cost"] = products[indexProduct].cost;
                item["SKU"] = products[indexProduct].SKU;
            }
            if (item.options.length > 0 || item.sub_product_id) {
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
            if (indexProduct === -1) {
                data.push(Object.assign(Object.assign({}, item), { title: "Deleted Product", thumbnail: "", price: 0 }));
            }
            else {
                data.push(item);
            }
        }
        res.json({
            code: 200,
            message: "Cart ok!!",
            data: {
                carts: data,
                cart_id: cart.id,
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
exports.getCart = getCart;
const addProduct = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const cart_id = req.params.cartId;
        const cart_id_in_session = req.cartId;
        const { productType } = req.body;
        if (!cart_id) {
            throw Error("Missing cart_id");
        }
        if (cart_id !== cart_id_in_session) {
            res.status(403).json({
                code: 403,
                message: "Forbidden",
            });
            return;
        }
        const body = req.body;
        let cart;
        const product_id = body.product_id;
        if (!product_id) {
            res.status(400).json({
                code: 400,
                message: "Missing product_id",
            });
            return;
        }
        if (productType === "simple") {
            const cartItem = yield cartDetail_model_1.default.findOne({
                cart_id: cart_id,
                product_id: product_id,
            });
            if (cartItem) {
                cartItem.quantity = cartItem.quantity + body.quantity;
                yield cartItem.save();
                cart = cartItem.toObject();
            }
            else {
                const newItem = new cartDetail_model_1.default(Object.assign(Object.assign({}, body), { cart_id: cart_id, product_id: product_id }));
                yield newItem.save();
                cart = newItem.toObject();
            }
        }
        else {
            const sub_product_id = body.sub_product_id;
            const cartItem = yield cartDetail_model_1.default.findOne({
                cart_id: cart_id,
                sub_product_id: sub_product_id,
            });
            if (cartItem) {
                cartItem.quantity = cartItem.quantity + body.quantity;
                yield cartItem.save();
                cart = cartItem.toObject();
            }
            else {
                const newItem = new cartDetail_model_1.default(Object.assign(Object.assign({}, body), { cart_id: cart_id, product_id: product_id, sub_product_id: sub_product_id }));
                yield newItem.save();
                cart = newItem.toObject();
            }
        }
        res.json({
            code: 200,
            message: "Success!!",
            data: {
                cartItem: Object.assign(Object.assign({}, cart), { cartItem_id: String(cart._id) }),
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
exports.addProduct = addProduct;
const updateQuantity = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const cartItem_id = req.params.cartItemId;
        const cart_id = req.cartId;
        const quantity = req.body.quantity;
        if (!cartItem_id) {
            throw Error("Missing cart_item_id!");
        }
        const cart = yield cartDetail_model_1.default.findOne({ _id: cartItem_id, cart_id });
        if (!cart) {
            throw Error("Cart item not found!");
        }
        cart.quantity += quantity;
        yield cart.save();
        res.json({
            code: 200,
            message: "Success!!",
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
exports.updateQuantity = updateQuantity;
const changeSubProduct = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const cartItem_id = req.params.cartItemId;
        const cart_id = req.cartId;
        const body = req.body;
        if (!cartItem_id) {
            throw Error("Missing cart_item_id!");
        }
        const cart = yield cartDetail_model_1.default.findOne({ _id: cartItem_id, cart_id });
        if (!cart) {
            throw Error("Cart item not found!");
        }
        cart.sub_product_id = body._id;
        cart.options = [...body.options];
        yield cart.save();
        res.json({
            code: 200,
            message: "Success!!",
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
exports.changeSubProduct = changeSubProduct;
const remove = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const cartItem_id = req.params.cartItemId;
        const cart_id = req.cartId;
        if (!cartItem_id) {
            throw Error("Missing cart_item_id!");
        }
        yield cartDetail_model_1.default.deleteOne({ _id: cartItem_id, cart_id });
        res.json({
            code: 200,
            message: "Success!!",
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
exports.remove = remove;
