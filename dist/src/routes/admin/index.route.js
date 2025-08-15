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
const auth_route_1 = __importDefault(require("./auth.route"));
const supplier_route_1 = __importDefault(require("./supplier.route"));
const auth = __importStar(require("../../middlewares/admin/auth.middleware"));
const upload_route_1 = __importDefault(require("./upload.route"));
const category_route_1 = __importDefault(require("./category.route"));
const product_route_1 = __importDefault(require("./product.route"));
const variation_route_1 = __importDefault(require("./variation.route"));
const variationOption_route_1 = __importDefault(require("./variationOption.route"));
const promotion_route_1 = __importDefault(require("./promotion.route"));
const purchase_route_1 = __importDefault(require("./purchase.route"));
const order_route_1 = __importDefault(require("./order.route"));
const report_route_1 = __importDefault(require("./report.route"));
const customer_route_1 = __importDefault(require("./customer.route"));
const review_route_1 = __importDefault(require("./review.route"));
const blog_route_1 = __importDefault(require("./blog.route"));
const AIAssistant_route_1 = __importDefault(require("./AIAssistant.route"));
const subscriber_route_1 = __importDefault(require("./subscriber.route"));
const route = (app) => {
    const path = "/admin";
    app.use(path + "/auth", auth_route_1.default);
    app.use(path + "/suppliers", auth.isAccess, supplier_route_1.default);
    app.use(path + "/upload", auth.isAccess, upload_route_1.default);
    app.use(path + "/categories", auth.isAccess, category_route_1.default);
    app.use(path + "/products", auth.isAccess, product_route_1.default);
    app.use(path + "/variations", auth.isAccess, variation_route_1.default);
    app.use(path + "/variation-options", auth.isAccess, variationOption_route_1.default);
    app.use(path + "/promotions", auth.isAccess, promotion_route_1.default);
    app.use(path + "/purchase-orders", auth.isAccess, purchase_route_1.default);
    app.use(path + "/orders", auth.isAccess, order_route_1.default);
    app.use(path + "/reports", auth.isAccess, report_route_1.default);
    app.use(path + "/customers", auth.isAccess, customer_route_1.default);
    app.use(path + "/reviews", auth.isAccess, review_route_1.default);
    app.use(path + "/blogs", auth.isAccess, blog_route_1.default);
    app.use(path + "/subscribers", auth.isAccess, subscriber_route_1.default);
    app.use(path + "/ai-assistant", auth.isAccess, AIAssistant_route_1.default);
};
exports.default = route;
