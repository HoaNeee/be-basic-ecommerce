import { Router } from "express";

import * as controller from "../../controllers/admin/auth.controller";
import * as authMiddleware from "../../middlewares/admin/auth.middleware";

const router: Router = Router();

router.post("/login", controller.login);
router.post("/register", controller.register);
router.post("/google-login", controller.googleLogin);
router.get("/refresh-token", controller.refreshToken);
router.get("/profile", authMiddleware.isAccess, controller.profile);
router.patch("/profile/edit", authMiddleware.isAccess, controller.editProfile);
router.patch(
  "/profile/change-password",
  authMiddleware.isAccess,
  controller.changePassword
);

const authRouter = router;

export default authRouter;
