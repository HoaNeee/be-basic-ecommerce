import { Router } from "express";

import * as controller from "../../controllers/admin/order.controller";

const router = Router();

router.get("/", controller.index);
router.get("/statistic", controller.statistic);
router.get("/chart", controller.getDataChart);
router.get("/chart-2", controller.getDataChart2);
router.get("/detail/:id", controller.detail);
router.patch("/change-status/:id", controller.changeStatus);

const orderRouter = router;

export default orderRouter;
