import { Router } from "express";
import * as controller from "../../controllers/admin/subscriber.controller";

const router = Router();

router.get("/", controller.getSubscribers);
router.patch("/:id", controller.updateSentEmail);

const subscriberRouter = router;

export default subscriberRouter;
