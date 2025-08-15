import { Express } from "express";
import authRouter from "./auth.route";
import supplierRouter from "./supplier.route";
import * as auth from "../../middlewares/admin/auth.middleware";
import uploadRouter from "./upload.route";
import categoryRouter from "./category.route";
import productRouter from "./product.route";
import variationRouter from "./variation.route";
import variationOptionRouter from "./variationOption.route";
import promotionRouter from "./promotion.route";
import purchaseRouter from "./purchase.route";
import orderRouter from "./order.route";
import reportRouter from "./report.route";
import customerRoute from "./customer.route";
import reviewRoute from "./review.route";
import blogRouter from "./blog.route";
import aiAssistantRouter from "./AIAssistant.route";
import subscriberRouter from "./subscriber.route";

const route = (app: Express) => {
  const path = "/admin";

  app.use(path + "/auth", authRouter);

  app.use(path + "/suppliers", auth.isAccess, supplierRouter);
  app.use(path + "/upload", auth.isAccess, uploadRouter);
  app.use(path + "/categories", auth.isAccess, categoryRouter);
  app.use(path + "/products", auth.isAccess, productRouter);
  app.use(path + "/variations", auth.isAccess, variationRouter);
  app.use(path + "/variation-options", auth.isAccess, variationOptionRouter);
  app.use(path + "/promotions", auth.isAccess, promotionRouter);
  app.use(path + "/purchase-orders", auth.isAccess, purchaseRouter);
  app.use(path + "/orders", auth.isAccess, orderRouter);
  app.use(path + "/reports", auth.isAccess, reportRouter);
  app.use(path + "/customers", auth.isAccess, customerRoute);
  app.use(path + "/reviews", auth.isAccess, reviewRoute);
  app.use(path + "/blogs", auth.isAccess, blogRouter);
  app.use(path + "/subscribers", auth.isAccess, subscriberRouter);
  app.use(path + "/ai-assistant", auth.isAccess, aiAssistantRouter);
};

export default route;
