import express, { Express } from "express";
import dotenv from "dotenv";
import * as database from "./configs/database";
import cors from "cors";
import AdminRoute from "./src/routes/admin/index.route";
import ClientRoute from "./src/routes/client/index.route";
import NotificationRoute from "./src/routes/notification.route";
import cookieParser from "cookie-parser";
dotenv.config();

database.connect();

const app: Express = express();

app.use(
  cors({
    origin: [
      "http://localhost:3000",
      "http://localhost:5173",
      "https://shop.kakrist.site",
      "https://admin-panel-tawny-mu.vercel.app",
      "https://basic-e-commerce-kkrist.vercel.app",
    ],

    credentials: true,
  })
);

app.use(cookieParser());
app.use(express.urlencoded({ extended: false }));
app.use(express.json());

ClientRoute(app);
AdminRoute(app);
NotificationRoute(app);

const PORT: number | string = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`server is running at port ${PORT}`);
});
