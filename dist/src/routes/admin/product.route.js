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
router.get("/detail/:id", controller.detail_v2);
router.get("/top-sell", controller.topSell);
router.get("/low-quantity", controller.lowQuantity);
router.get("/trash", controller.trashProducts);
router.get("/sub-product-trash", controller.trashSubProducts);
router.get("/get-price", controller.getPriceProduct);
router.get("/get-all-sku", controller.getAllSKU);
router.get("/get-all-product-ids", controller.getAllProductID);
router.get("/embed", controller.getEmbedProduct);
router.get("/embed/statistics", controller.getEmbedStatistic);
router.get("/sub-products/embed", controller.getEmbedSubProduct);
router.get("/embed/not-embedded", controller.getProductNotEmbeded);
router.post("/create", controller.create);
router.post("/products-sku", controller.productsSKU);
router.post("/filter-product", controller.filterProduct);
router.post("/embed/:productId", controller.embedProduct);
router.post("/embed/sync/sync-time", controller.syncEmbedTime);
router.patch("/change-multi", controller.changeMulti);
router.patch("/edit-sub-product/:id", controller.editSubProduct_v2);
router.patch("/edit/:id", controller.edit);
router.patch("/change-trash/:productId", controller.changeTrashOne);
router.patch("/change-sub-product-trash/:subId", controller.changeSubproductTrashOne);
router.patch("/bulk-trash", controller.bulkChangeTrash);
router.patch("/bulk-sub-trash", controller.bulkChangeSubProductTrash);
router.patch("/change-trash-all", controller.changeTrashAll);
router.patch("/change-sub-trash-all", controller.changeSubProductTrashAll);
router.patch("/embed/sync/:vector_id", controller.syncEmbedProduct);
router.patch("/embed/change/indexed", controller.changeIndexed);
router.delete("/delete/:id", controller.remove);
router.delete("/delete/sub-product/:id", controller.removeSubProduct);
router.delete("/embed/delete/:vector_id", controller.deleteEmbedProduct);
router.delete("/embed/bulk-delete", controller.bulkEmbedProduct);
const productRouter = router;
exports.default = productRouter;
