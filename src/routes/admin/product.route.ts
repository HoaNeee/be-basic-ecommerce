import { Router } from "express";
import * as controller from "../../controllers/admin/product.controller";

const router: Router = Router();

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
export default productRouter;
