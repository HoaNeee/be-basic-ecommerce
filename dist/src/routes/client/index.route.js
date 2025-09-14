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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const category_route_1 = __importDefault(require("./category.route"));
const auth_route_1 = __importDefault(require("./auth.route"));
const promotion_route_1 = __importDefault(require("./promotion.route"));
const product_route_1 = __importDefault(require("./product.route"));
const cart_route_1 = __importDefault(require("./cart.route"));
const address_route_1 = __importDefault(require("./address.route"));
const review_route_1 = __importDefault(require("./review.route"));
const authMiddleware = __importStar(require("../../middlewares/client/auth.middleware"));
const upload_route_1 = __importDefault(require("./upload.route"));
const supplier_route_1 = __importDefault(require("./supplier.route"));
const order_route_1 = __importDefault(require("./order.route"));
const favorite_route_1 = __importDefault(require("./favorite.route"));
const blog_route_1 = __importDefault(require("./blog.route"));
const search_route_1 = __importDefault(require("./search.route"));
const transaction_route_1 = __importDefault(require("./transaction.route"));
const chatbot_route_1 = __importDefault(require("./chatbot.route"));
const suggestion_route_1 = __importDefault(require("./suggestion.route"));
const settingMiddleware = __importStar(require("../../middlewares/setting.middleware"));
const subscriber_route_1 = __importDefault(require("./subscriber.route"));
const ClientRoute = (app) => {
    app.use(settingMiddleware.setting);
    app.use("/auth", auth_route_1.default);
    app.use("/categories", category_route_1.default);
    app.use("/promotions", promotion_route_1.default);
    app.use("/products", product_route_1.default);
    app.use("/reviews", review_route_1.default);
    app.use("/suppliers", supplier_route_1.default);
    app.use("/blogs", blog_route_1.default);
    app.use("/search", search_route_1.default);
    app.use("/chatbot", chatbot_route_1.default);
    app.use("/suggestions", suggestion_route_1.default);
    app.use("/subscribers", subscriber_route_1.default);
    app.use("/cart", authMiddleware.isAccess, cart_route_1.default);
    app.use("/address", authMiddleware.isAccess, address_route_1.default);
    app.use("/orders", authMiddleware.isAccess, order_route_1.default);
    app.use("/favorites", authMiddleware.isAccess, favorite_route_1.default);
    app.use("/transaction", authMiddleware.isAccess, transaction_route_1.default);
    app.use("/upload", authMiddleware.isAccess, upload_route_1.default);
};
exports.default = ClientRoute;
