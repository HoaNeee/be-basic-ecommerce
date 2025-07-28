import { Router, Express } from "express";
import categoryRouter from "./category.route";
import authRouter from "./auth.route";
import promotionRouter from "./promotion.route";
import productRouter from "./product.route";
import cartRouter from "./cart.route";
import addressRouter from "./address.route";
import reviewRouter from "./review.route";
import * as authMiddleware from "../../middlewares/client/auth.middleware";
import uploadRouter from "./upload.route";
import supplierRouter from "./supplier.route";
import paymentRouter from "./pament.route";
import orderRouter from "./order.route";
import favoriteRouter from "./favorite.route";
import blogRouter from "./blog.route";
import searchRouter from "./search.route";

const ClientRoute = (app: Express) => {
  app.use("/auth", authRouter);
  app.use("/categories", categoryRouter);
  app.use("/promotions", promotionRouter);
  app.use("/products", productRouter);
  app.use("/reviews", reviewRouter);
  app.use("/suppliers", supplierRouter);
  app.use("/blogs", blogRouter);
  app.use("/search", searchRouter);

  app.use("/cart", authMiddleware.isAccess, cartRouter);
  app.use("/address", authMiddleware.isAccess, addressRouter);
  app.use("/payments", authMiddleware.isAccess, paymentRouter);
  app.use("/orders", authMiddleware.isAccess, orderRouter);
  app.use("/favorites", authMiddleware.isAccess, favoriteRouter);
  app.use("/upload", authMiddleware.isAccess, uploadRouter);
};

export default ClientRoute;
