import express, { Express } from "express";
import dotenv from "dotenv";
import * as database from "./configs/database";
import cors from "cors";
import AdminRoute from "./src/routes/admin/index.route";
import ClientRoute from "./src/routes/client/index.route";
import NotificationRoute from "./src/routes/notification.route";
import SettingRoute from "./src/routes/setting.route";
import cookieParser from "cookie-parser";
import http from "node:http";
import { Server } from "socket.io";
import * as socket from "./socket";
import session, { MemoryStore } from "express-session";
import { rateLimit } from "express-rate-limit";
import MongoStore from "connect-mongo";

const isProduction = process.env.NODE_ENV === "production";

const limiter = rateLimit({
	windowMs: 15 * 60 * 1000, // 15 minutes
	max: 2000,
	message: "Too many requests from this IP, please try again later.",
	standardHeaders: true,
	legacyHeaders: false,
});

dotenv.config();
database.connect();
database.connectQdrant();

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

const store = isProduction
	? new MongoStore({
			mongoUrl: process.env.MONGO_URL,
			collectionName: "sessions",
			ttl: 24 * 60 * 60,
	  })
	: new MemoryStore();

app.use(cookieParser());
app.use(express.urlencoded({ extended: false }));
app.use(express.json());
app.use(
	session({
		secret: process.env.SESSION_SECRET,
		resave: false,
		saveUninitialized: false,
		cookie: {
			secure: isProduction,
			httpOnly: true,
			sameSite: isProduction ? "none" : "lax",
			domain: isProduction ? ".kakrist.site" : undefined,
			maxAge: undefined,
		},
		store: store,
	})
);

app.use(limiter);

ClientRoute(app);
AdminRoute(app);
NotificationRoute(app);
SettingRoute(app);

app.get("/test-cookie", (req, res) => {
	res.cookie("test_cookie", "test_value", {
		httpOnly: true,
		secure: isProduction,
		sameSite: isProduction ? "none" : "lax",
		domain: isProduction ? ".kakrist.site" : undefined,
	});
	res.send("Test cookie set");
});

socket.connect(io);

const PORT: number | string = process.env.PORT || 3001;

server.listen(PORT, () => {
	console.log(`server is running at port ${PORT}`);
});
