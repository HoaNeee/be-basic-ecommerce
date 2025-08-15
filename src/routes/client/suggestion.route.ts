import { Router } from "express";
import * as controller from "../../controllers/client/suggestion.controller";
import { validatorTrackSuggestion } from "../../validate/client/suggestion.validate";

const router: Router = Router();

router.get("/", controller.getTrackedList);
router.post("/track", validatorTrackSuggestion, controller.trackSuggestion);

const suggestRouter = router;
export default suggestRouter;
