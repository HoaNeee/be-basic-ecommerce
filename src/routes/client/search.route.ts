import { Router } from "express";
import * as controller from "../../controllers/client/search.controller";

const router: Router = Router();

router.get("/", controller.search);
router.get("/suggest", controller.suggest);

const searchRouter = router;
export default searchRouter;
