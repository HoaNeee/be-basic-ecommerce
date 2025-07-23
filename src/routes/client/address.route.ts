import { Router } from "express";
import * as controller from "../../controllers/client/address.controller";

const router: Router = Router();

router.get("/", controller.index);
router.get("/default", controller.addressDefault);
router.post("/create", controller.create);
router.patch("/edit/:id", controller.edit);
router.delete("/delete/:id", controller.remove);

const addressRouter = router;
export default addressRouter;
