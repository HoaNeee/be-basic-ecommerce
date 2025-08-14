import { Router } from "express";
import * as controller from "../../controllers/client/cart.controller";
import * as cartMiddleware from "../../middlewares/client/cart.middleware";

const router: Router = Router();

router.get("/", controller.getCart);
router.post(
  "/add-product/:cartId",
  cartMiddleware.isExist,
  controller.addProduct
);
router.delete("/delete/:cartItemId", cartMiddleware.isExist, controller.remove);
router.patch(
  "/update-quantity/:cartItemId",
  cartMiddleware.isExist,
  controller.updateQuantity
);
router.patch(
  "/change-subProduct/:cartItemId",
  cartMiddleware.isExist,
  controller.changeSubProduct
);

const cartRouter = router;
export default cartRouter;
