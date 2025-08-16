"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createContact = exports.createSubscriber = void 0;
const subscriber_model_1 = __importDefault(require("../../models/subscriber.model"));
const customerContact_model_1 = __importDefault(require("../../models/customerContact.model"));
const createSubscriber = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { email } = req.body;
        if (!email) {
            res.status(400).json({ code: 400, error: "Email is required" });
            return;
        }
        const exist = yield subscriber_model_1.default.findOne({ email });
        if (exist) {
            res.status(200).json({ code: 200, message: "Subscriber successfully!" });
            return;
        }
        const newSubscriber = new subscriber_model_1.default({ email });
        yield newSubscriber.save();
        res.status(200).json({
            code: 200,
            message: "Subscriber successfully!",
        });
    }
    catch (error) {
        res.status(500).json({ code: 500, error: "Failed to subscribe" });
    }
});
exports.createSubscriber = createSubscriber;
const createContact = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { email, name, message, phone, subject } = req.body;
        if (!email || !name || !message || !phone || !subject) {
            res.status(400).json({ code: 400, error: "All fields are required" });
            return;
        }
        const newContact = new customerContact_model_1.default({
            email,
            name,
            message,
            phone,
            subject,
        });
        yield newContact.save();
        res.status(200).json({
            code: 200,
            message: "Contact created successfully!",
        });
    }
    catch (error) {
        res.status(500).json({ code: 500, error: "Failed to create contact" });
    }
});
exports.createContact = createContact;
