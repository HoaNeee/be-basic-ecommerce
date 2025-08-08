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
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const controller = __importStar(require("../../controllers/admin/product.controller"));
const router = (0, express_1.Router)();
router.get("/", controller.products);
router.post("/create", controller.create);
router.get("/detail/:id", controller.detail_v2);
router.patch("/edit/:id", controller.edit);
router.patch("/edit-sub-product/:id", controller.editSubProduct_v2);
router.get("/get-price", controller.getPriceProduct);
router.post("/filter-product", controller.filterProduct);
router.delete("/delete/:id", controller.remove);
router.delete("/delete/sub-product/:id", controller.removeSubProduct);
router.patch("/change-multi", controller.changeMulti);
router.get("/get-all-sku", controller.getAllSKU);
router.post("/products-sku", controller.productsSKU);
router.get("/top-sell", controller.topSell);
router.get("/low-quantity", controller.lowQuantity);
router.post("/test-socket", controller.testSocket);
const productRouter = router;
exports.default = productRouter;
