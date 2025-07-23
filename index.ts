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
    origin: ["https://shop.kakrist.site"],
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
