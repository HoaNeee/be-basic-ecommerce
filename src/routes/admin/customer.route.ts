import { Router } from "express";

import * as controller from "../../controllers/admin/customer.controller";

const router: Router = Router();

router.get("/", controller.index);
router.patch("/change-status/:id", controller.changeStatus);

const customerRoute = router;

export default customerRoute;
