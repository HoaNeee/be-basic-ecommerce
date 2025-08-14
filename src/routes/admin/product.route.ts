import { Router } from "express";
import * as controller from "../../controllers/admin/product.controller";

const router: Router = Router();

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
router.patch(
  "/change-sub-product-trash/:subId",
  controller.changeSubproductTrashOne
);
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
export default productRouter;
