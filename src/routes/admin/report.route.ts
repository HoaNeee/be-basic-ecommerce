import { Router } from "express";
import * as controller from "../../controllers/admin/report.controller";

const router: Router = Router();

router.get("/overview", controller.getDataReport);
router.get("/top-sell-categories", controller.getCategoryTopSell);

const reportRouter = router;
export default reportRouter;
