import { Express } from "express";
import * as controller from "../controllers/notification.controller";
import * as adminMiddleware from "../middlewares/admin/auth.middleware";
import * as customerMiddleware from "../middlewares/client/auth.middleware";

const route = (app: Express) => {
  app.get("/admin/notifications", adminMiddleware.isAccess, controller.admin);
  app.get("/notifications", customerMiddleware.isAccess, controller.customers);
  app.get(
    "/notifications/check-read",
    customerMiddleware.isAccess,
    controller.checkRead
  );
  app.patch(
    "/notifications/read/:id",
    customerMiddleware.isAccess,
    controller.customerRead
  );
  app.patch(
    "/admin/notifications/read/:id",
    adminMiddleware.isAccess,
    controller.adminRead
  );
};

export default route;
