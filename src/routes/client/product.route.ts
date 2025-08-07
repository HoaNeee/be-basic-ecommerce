import { Router } from "express";
import * as controller from "../../controllers/client/product.controller";

const router: Router = Router();

router.get("/", controller.products_v2);
router.get("/detail/:slug", controller.detail);
router.get("/get-price", controller.getPriceProduct);
router.get("/best-seller", controller.getBestSeller);
router.get("/related", controller.getRelatedProduct);
router.get("/variations", controller.getVariationOptions);

const productRouter = router;
export default productRouter;
