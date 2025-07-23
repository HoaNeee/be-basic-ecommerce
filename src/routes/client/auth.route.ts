import { Router, Request, Response } from "express";

import * as controller from "../../controllers/client/auth.controller";
import * as authMiddleware from "../../middlewares/client/auth.middleware";

const router: Router = Router();

router.post("/login", controller.login);
router.post("/register", controller.register);
router.post("/logout", controller.logout);
router.get("/profile", authMiddleware.isAccess, controller.getInfo);
router.patch(
  "/profile/change-password",
  authMiddleware.isAccess,
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
