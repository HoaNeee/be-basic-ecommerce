import { Router } from "express";
import * as controller from "../../controllers/client/order.controller";
import {
  changeStatusValidation,
  createOrderValidation,
} from "../../validate/client/order.validate";

const router: Router = Router();

router.get("/", controller.orders);
router.get("/detail/:order_no", controller.detail);
router.get("/products-info/:order_no", controller.getProductInfo);
router.get(
  "/reorder/get-products-and-create-cart/:order_no",
  controller.getProductAndCreateCartItemReorder
);
router.post("/review-multi", controller.reviewMultiProducts);
router.post("/create", createOrderValidation, controller.create);
router.patch(
  "/change-status/:id",
  changeStatusValidation,
  controller.changeStatus
);

const orderRouter = router;
export default orderRouter;
