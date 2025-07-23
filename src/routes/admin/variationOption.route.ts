import { Router } from "express";
import * as controller from "../../controllers/admin/variationOption.controller";

const router: Router = Router();

router.get("/", controller.index);
router.post("/create", controller.create);
router.patch("/edit/:id", controller.edit);
router.delete("/delete/:id", controller.remove);

const variationOptionRouter = router;
export default variationOptionRouter;
