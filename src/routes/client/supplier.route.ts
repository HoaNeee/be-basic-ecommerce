import { Router } from "express";
import * as controller from "../../controllers/client/supplier.controller";

const router: Router = Router();

router.get("/", controller.index);

const supplierRouter = router;
export default supplierRouter;
