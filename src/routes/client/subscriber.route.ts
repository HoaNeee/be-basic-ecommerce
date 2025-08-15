import { Router } from "express";
import { createSubscriber } from "../../controllers/client/subscriber.controller";

const router = Router();

router.post("/", createSubscriber);

const subscriberRouter = router;

export default subscriberRouter;
