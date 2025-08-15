"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const subscriber_controller_1 = require("../../controllers/client/subscriber.controller");
const router = (0, express_1.Router)();
router.post("/", subscriber_controller_1.createSubscriber);
const subscriberRouter = router;
exports.default = subscriberRouter;
