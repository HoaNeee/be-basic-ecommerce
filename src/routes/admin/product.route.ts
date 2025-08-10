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

router.post("/create", controller.create);
router.post("/products-sku", controller.productsSKU);
router.post("/filter-product", controller.filterProduct);

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

router.delete("/delete/:id", controller.remove);
router.delete("/delete/sub-product/:id", controller.removeSubProduct);

const productRouter = router;
export default productRouter;
