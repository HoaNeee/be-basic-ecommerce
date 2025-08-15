import { Router } from "express";
import * as controller from "../../controllers/admin/supplier.controller";

const router: Router = Router();

router.get("/", controller.suppliers);
router.post("/create", controller.create);
router.patch("/edit/:id", controller.update);
router.delete("/delete/:id", controller.remove);
router.get("/get-form", controller.form);
router.post("/export-excel", controller.exportExcel);
router.get("/data-export", controller.dataExport);

const supplierRouter = router;
export default supplierRouter;
