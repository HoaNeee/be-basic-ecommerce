import { Router } from "express";
import {
  createContact,
  createSubscriber,
} from "../../controllers/client/subscriber.controller";

const router = Router();

router.post("/", createSubscriber);
router.post("/create-contact", createContact);

const subscriberRouter = router;

export default subscriberRouter;
