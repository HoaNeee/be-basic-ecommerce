import express, { Express } from "express";
import dotenv from "dotenv";
import * as database from "./configs/database";
import cors from "cors";
import AdminRoute from "./src/routes/admin/index.route";
import ClientRoute from "./src/routes/client/index.route";
import NotificationRoute from "./src/routes/notification.route";
import cookieParser from "cookie-parser";
import http from "node:http";
import { Server } from "socket.io";
import * as socket from "./socket";
import session from "express-session";

dotenv.config();
database.connect();

const app: Express = express();

const server = http.createServer(app);

const whiteList = [
  "http://localhost:3000",
  "http://localhost:5173",
  "https://shop.kakrist.site",
  "https://admin-panel-tawny-mu.vercel.app",
  "https://basic-e-commerce-kkrist.vercel.app",
];

const io = new Server(server, {
  cors: {
    origin: whiteList,
    credentials: true,
  },
});

app.set("trust proxy", 1);

app.use(
  cors({
    origin: whiteList,
    credentials: true,
  })
);

app.use(cookieParser());
app.use(express.urlencoded({ extended: false }));
app.use(express.json());
app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: true,
    saveUninitialized: false,
    cookie:
      process.env.NODE_ENV === "production"
        ? {
            secure: process.env.NODE_ENV === "production",
            httpOnly: true,
            sameSite: "none",
            domain: ".kakrist.site",
          }
        : {
            secure: false,
          },
  })
);

ClientRoute(app);
AdminRoute(app);
NotificationRoute(app);

socket.connect(io);

const PORT: number | string = process.env.PORT || 3001;

server.listen(PORT, () => {
  console.log(`server is running at port ${PORT}`);
});
