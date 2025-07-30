import { Router } from "express";
import * as controller from "../../controllers/client/transaction.controller";

const router: Router = Router();

router.post("/start", controller.startTransaction);
router.patch("/change", controller.transactionChange);
router.get("/detail", controller.transactionDetail);

const transactionRouter = router;
export default transactionRouter;
