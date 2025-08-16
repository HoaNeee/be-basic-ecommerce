import { Router } from "express";
import * as controller from "../../controllers/admin/customerContact.controller";

const router = Router();

router.get("/", controller.getCustomerContacts);
router.get("/stats", controller.getCustomerContactsStats);
router.post("/reply/:id", controller.replyCustomerContact);
router.patch("/mark-resolved/:id", controller.markContactResolved);

const customerContactRouter = router;

export default customerContactRouter;
