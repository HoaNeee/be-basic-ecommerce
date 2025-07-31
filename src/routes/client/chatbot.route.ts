import { Router } from "express";
import * as controller from "../../controllers/client/chatbot.controller";
const router = Router();

router.get("/history", controller.getHistoryChat);
router.post("/", controller.chatBot);

const chatBotRouter = router;
export default chatBotRouter;
