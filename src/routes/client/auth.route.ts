import { Router, Request, Response, NextFunction } from "express";
import { rateLimit } from "express-rate-limit";

import * as controller from "../../controllers/client/auth.controller";
import * as authMiddleware from "../../middlewares/client/auth.middleware";

const router: Router = Router();

const limiter = (max?: number, time?: number, key?: string) => {
  return rateLimit({
    windowMs: (time || 10) * 60 * 1000,
    max: max || 100,
    message: "Too many requests from this IP, please try again later.",
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req: Request, res: Response) => {
      return key ? req[key] : undefined;
    },
  });
};

const limiterAuth = limiter(10, 5, "body.email");

router.post("/login", limiterAuth, controller.login);
router.post("/register", limiterAuth, controller.register);
router.post("/logout", controller.logout);
router.post("/google", controller.googleLogin);
router.get("/profile", authMiddleware.isAccess, controller.getInfo);
router.patch(
  "/profile/change-password",
  authMiddleware.isAccess,
  limiterAuth,
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

router.post("/forgot-password", limiter(100, 15), controller.forgotPassword);
router.post(
  "/forgot-password/verify-otp",
  limiter(100, 15),
  controller.verifyOTP
);

const authRouter = router;

export default authRouter;
