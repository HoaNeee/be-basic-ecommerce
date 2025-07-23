import { Router } from "express";
import * as controller from "../../controllers/client/promotion.controller";

const router: Router = Router();

router.get("/", controller.promotions);
router.get("/check-code", controller.checkCode);
router.get("/deal-of-month", controller.dealOfMonth);

const promotionRouter = router;
export default promotionRouter;
