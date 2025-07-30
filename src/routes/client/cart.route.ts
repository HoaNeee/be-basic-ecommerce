import { Router } from "express";
import * as controller from "../../controllers/client/cart.controller";

const router: Router = Router();

router.get("/", controller.getCart);
router.post("/add-product/:cartId", controller.addProduct);
router.delete("/delete/:cartItemId", controller.remove);
router.patch("/update-quantity/:cartItemId", controller.updateQuantity);
router.patch("/change-subProduct/:cartItemId", controller.changeSubProduct);

const cartRouter = router;
export default cartRouter;
