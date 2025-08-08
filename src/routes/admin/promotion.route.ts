import { Router } from "express";
import * as controller from "../../controllers/admin/promotion.controller";

const router: Router = Router();

router.get("/", controller.promotions);
router.post("/create", controller.create);
router.patch("/edit/:id", controller.edit);
router.delete("/delete/:id", controller.remove);

const promotionRouter = router;
export default promotionRouter;
