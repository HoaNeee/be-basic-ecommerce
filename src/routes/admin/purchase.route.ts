import { Router } from "express";

import * as controller from "../../controllers/admin/purchase.controller";

const router = Router();

router.get("/", controller.purchases);
router.get("/statistic", controller.statistic);
router.post("/create", controller.create);
router.patch("/change-status/:id", controller.changeStatus);
router.get("/chart", controller.getDataChart);

const purchaseRouter = router;

export default purchaseRouter;
