import { Router } from "express";
import * as controller from "../../controllers/admin/subscriber.controller";

const router = Router();

router.get("/", controller.getSubscribers);
router.get("/stats", controller.getSubscribersStats);
router.patch("/bulk", controller.updateBulk);
router.patch("/send-all", controller.updateSentAll);
router.patch("/:id", controller.updateSentEmail);

const subscriberRouter = router;

export default subscriberRouter;
