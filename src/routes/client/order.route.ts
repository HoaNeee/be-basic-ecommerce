import { Router } from "express";
import * as controller from "../../controllers/client/order.controller";

const router: Router = Router();

router.get("/", controller.index);
router.get("/detail/:order_no", controller.detail);
router.post("/create", controller.create);
router.patch("/edit/:id", controller.editBill);
router.patch("/change-status/:id", controller.changeStatus);

const orderRouter = router;
export default orderRouter;
