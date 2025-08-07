import { Router } from "express";
import * as controller from "../../controllers/client/suggestion.controller";
import { validateTrackSuggestion } from "../../validate/suggestion.validate";

const router: Router = Router();

router.get("/", controller.getTrackedList);
router.post("/track", validateTrackSuggestion, controller.trackSuggestion);

const suggestRouter = router;
export default suggestRouter;
