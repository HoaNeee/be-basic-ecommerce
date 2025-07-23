import { Router } from "express";
import * as controller from "../../controllers/client/payment.controller";

const router: Router = Router();

router.get("/", controller.index);
router.post("/create", controller.create);

const paymentRouter = router;
export default paymentRouter;
