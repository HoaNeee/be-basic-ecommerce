import { Router, Response, NextFunction } from "express";
import * as controller from "../../controllers/client/chatbot.controller";
import { MyRequest } from "../../middlewares/client/auth.middleware";
import jwt from "jsonwebtoken";
const router = Router();

const chatMiddleware = (req: MyRequest, res: Response, next: NextFunction) => {
  const token = req.cookies.jwt_token;
  if (!token) {
    req.userId = "";
  }

  const decoded: any = jwt.decode(token);
  if (!decoded) {
    req.userId = "";
  } else {
    req.userId = decoded.userId;
  }

  next();
};

router.post("/test-api", controller.testAPI);

router.get("/history", controller.getHistoryChat);
router.post("/", chatMiddleware, controller.chatBot);

const chatBotRouter = router;
export default chatBotRouter;
