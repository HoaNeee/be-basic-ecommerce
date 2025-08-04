import { Router } from "express";
import * as controller from "../../controllers/client/suggestion.controller";

const router: Router = Router();

router.get("/", controller.getTrackedList);
router.post("/track", controller.trackSuggestion);

const suggestRouter = router;
export default suggestRouter;
