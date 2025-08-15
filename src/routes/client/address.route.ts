import { Router } from "express";
import * as controller from "../../controllers/client/address.controller";
import { createAddressValidation } from "../../validate/client/address.validate";

const router: Router = Router();

router.get("/", controller.index);
router.get("/default", controller.addressDefault);
router.post("/create", createAddressValidation, controller.create);
router.patch("/edit/:id", createAddressValidation, controller.edit);
router.delete("/delete/:id", controller.remove);

const addressRouter = router;
export default addressRouter;
