import { Router } from "express";

import * as controller from "../../controllers/admin/review.controller";

const router: Router = Router();

router.get("/", controller.reviews);
router.get("/statistics", controller.statistics);
router.delete("/delete/:id", controller.remove);
router.get("/comments/:id", controller.getComments);
router.delete("/comments/delete/:id", controller.removeComment);

const reviewRoute = router;

export default reviewRoute;
