"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const express_rate_limit_1 = require("express-rate-limit");
const controller = __importStar(require("../../controllers/client/auth.controller"));
const authMiddleware = __importStar(require("../../middlewares/client/auth.middleware"));
const auth_validate_1 = require("../../validate/client/auth.validate");
const router = (0, express_1.Router)();
const limiter = (max, time, key) => {
    return (0, express_rate_limit_1.rateLimit)({
        windowMs: (time || 10) * 60 * 1000,
        max: max || 100,
        message: "Too many requests from this IP, please try again later.",
        standardHeaders: true,
        legacyHeaders: false,
        keyGenerator: (req, res) => {
            return key ? req[key] : undefined;
        },
    });
};
const limiterAuth = limiter(10, 5, "body.email");
router.post("/login", limiterAuth, auth_validate_1.registerValidator, controller.login);
router.post("/register", limiterAuth, auth_validate_1.registerValidator, controller.register);
router.post("/logout", controller.logout);
router.post("/google", controller.googleLogin);
router.get("/profile", authMiddleware.isAccess, controller.getInfo);
router.patch("/profile/change-password", authMiddleware.isAccess, limiterAuth, controller.changePassword);
router.patch("/profile/edit", authMiddleware.isAccess, auth_validate_1.updateProfileValidator, controller.updateProfile);
router.patch("/profile/change-setting", authMiddleware.isAccess, controller.changeSetting);
router.post("/forgot-password", limiter(100, 15), controller.forgotPassword);
router.post("/forgot-password/verify-otp", limiter(100, 15), controller.verifyOTP);
const authRouter = router;
exports.default = authRouter;
