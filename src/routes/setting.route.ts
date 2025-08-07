import { Express } from "express";
import * as controller from "../controllers/setting.controller";
import * as authMiddleware from "../middlewares/admin/auth.middleware";

const route = (app: Express) => {
  app.patch(
    "/admin/settings",
    authMiddleware.isAccess,
    controller.changeSetting
  );

  app.get("/admin/settings", authMiddleware.isAccess, controller.getSetting);

  app.post(
    "/admin/settings/create-subdomain",
    authMiddleware.isAccess,
    controller.createSubdomain
  );
  app.delete(
    "/admin/settings/remove-subdomain",
    authMiddleware.isAccess,
    controller.removeSubdomain
  );
  app.get("/settings", controller.getSettingClient);
};

export default route;
