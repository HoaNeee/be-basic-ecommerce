import { Router, Request, Response } from "express";
import { rateLimit } from "express-rate-limit";

import * as controller from "../../controllers/client/auth.controller";
import * as authMiddleware from "../../middlewares/client/auth.middleware";

const router: Router = Router();

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  message: "Too many requests, please try again later.",
  standardHeaders: true,
  legacyHeaders: false,
});

router.post("/login", limiter, controller.login);
router.post("/register", limiter, controller.register);
router.post("/logout", controller.logout);
router.post("/google", controller.googleLogin);
router.get("/profile", authMiddleware.isAccess, controller.getInfo);
router.patch(
  "/profile/change-password",
  authMiddleware.isAccess,
  limiter,
  controller.changePassword
);
router.patch(
  "/profile/edit",
  authMiddleware.isAccess,
  controller.updateProfile
);
router.patch(
  "/profile/change-setting",
  authMiddleware.isAccess,
  controller.changeSetting
);

const authRouter = router;

export default authRouter;
