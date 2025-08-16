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
exports.markContactResolved = exports.replyCustomerContact = exports.getCustomerContactsStats = exports.getCustomerContacts = void 0;
const customerContact_model_1 = __importDefault(require("../../models/customerContact.model"));
const pagination_1 = __importDefault(require("../../../helpers/pagination"));
const getCustomerContacts = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const find = {};
        const keyword = req.query.keyword;
        const status = req.query.status;
        const subject = req.query.subject;
        if (keyword) {
            find["$or"] = [
                { email: { $regex: keyword, $options: "i" } },
                { name: { $regex: keyword, $options: "i" } },
                { subject: { $regex: keyword, $options: "i" } },
                { phone: { $regex: keyword, $options: "i" } },
            ];
        }
        if (status && status !== "all") {
            find["status"] = status;
        }
        if (subject && subject !== "all") {
            find["subject"] = subject;
        }
        const totalRecord = yield customerContact_model_1.default.countDocuments(find);
        const initPagination = {
            page: 1,
            limitItems: 10,
        };
        if (req.query.limit) {
            initPagination.limitItems = Number(req.query.limit);
        }
        const pagination = (0, pagination_1.default)(initPagination, req.query, totalRecord);
        const contacts = yield customerContact_model_1.default.find(find)
            .sort({ createdAt: -1 })
            .skip(pagination.skip)
            .limit(pagination.limitItems);
        res.status(200).json({
            code: 200,
            message: "Success",
            data: {
                contacts,
            },
        });
    }
    catch (error) {
        res
            .status(500)
            .json({ message: "Error fetching customer contacts: " + error });
    }
});
exports.getCustomerContacts = getCustomerContacts;
const getCustomerContactsStats = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const [totalContacts, resolvedContacts, responsedContacts, pendingContacts,] = yield Promise.all([
            customerContact_model_1.default.countDocuments(),
            customerContact_model_1.default.countDocuments({ status: "resolved" }),
            customerContact_model_1.default.countDocuments({ status: "responded" }),
            customerContact_model_1.default.countDocuments({ status: "pending" }),
        ]);
        res.status(200).json({
            code: 200,
            message: "Success",
            data: {
                totalContacts,
                resolvedContacts,
                responsedContacts,
                pendingContacts,
            },
        });
    }
    catch (error) {
        res
            .status(500)
            .json({ message: "Error fetching customer contacts stats: " + error });
    }
});
exports.getCustomerContactsStats = getCustomerContactsStats;
const replyCustomerContact = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const contactId = req.params.id;
        const { replyMessage, status } = req.body;
        if (!contactId || !replyMessage || !status) {
            res.status(400).json({ message: "Missing required fields" });
            return;
        }
        const updatedContact = yield customerContact_model_1.default.findByIdAndUpdate(contactId, { replyMessage, status }, { new: true });
        if (!updatedContact) {
            res.status(404).json({ message: "Contact not found" });
            return;
        }
        res.status(200).json({
            code: 200,
            message: "Success",
            data: {
                contact: updatedContact,
            },
        });
    }
    catch (error) {
        res
            .status(500)
            .json({ message: "Error replying to customer contact: " + error });
    }
});
exports.replyCustomerContact = replyCustomerContact;
const markContactResolved = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const contactId = req.params.id;
        if (!contactId) {
            res.status(400).json({ message: "Missing required fields" });
            return;
        }
        const updatedContact = yield customerContact_model_1.default.findByIdAndUpdate(contactId, { status: "resolved" }, { new: true });
        if (!updatedContact) {
            res.status(404).json({ message: "Contact not found" });
            return;
        }
        res.status(200).json({
            code: 200,
            message: "Success",
            data: {
                contact: updatedContact,
            },
        });
    }
    catch (error) {
        res
            .status(500)
            .json({ message: "Error replying to customer contact: " + error });
    }
});
exports.markContactResolved = markContactResolved;
