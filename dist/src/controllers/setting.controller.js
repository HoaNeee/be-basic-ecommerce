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
exports.getSettingClient = exports.removeSubdomain = exports.createSubdomain = exports.getSetting = exports.changeSetting = void 0;
const setting_model_1 = __importDefault(require("../models/setting.model"));
const changeSetting = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const settingData = req.body;
        const setting = yield setting_model_1.default.findOne({});
        const keywords = settingData.keywords || [];
        if (typeof keywords === "string") {
            settingData.keywords = keywords
                .replace(/<\/?[^>]+(>|$)/g, ",")
                .split(",")
                .map((keyword) => keyword.trim());
        }
        if (!setting) {
            const newSetting = new setting_model_1.default(settingData);
            yield newSetting.save();
            res.status(200).json({
                code: 200,
                message: "Settings created successfully",
                data: newSetting,
            });
            return;
        }
        const updatedSetting = yield setting_model_1.default.findOneAndUpdate({}, settingData, {
            new: true,
        });
        res.status(200).json({
            code: 200,
            message: "Settings updated successfully",
            data: updatedSetting,
        });
    }
    catch (error) {
        console.error("Error updating settings:", error);
        res.status(500).json({
            code: 500,
            message: "Internal server error",
        });
    }
});
exports.changeSetting = changeSetting;
const getSetting = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const setting = yield setting_model_1.default.findOne({});
        if (!setting) {
            res.status(404).json({
                code: 404,
                message: "Settings not found",
            });
            return;
        }
        res.status(200).json({
            code: 200,
            message: "successfully",
            data: setting,
        });
    }
    catch (error) {
        console.error("Error retrieving settings:", error);
        res.status(500).json({
            code: 500,
            message: "Internal server error",
        });
    }
});
exports.getSetting = getSetting;
const createSubdomain = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { subdomain } = req.body;
        if (!subdomain) {
            res.status(400).json({
                code: 400,
                message: "Invalid subdomain data",
            });
            return;
        }
        const setting = yield setting_model_1.default.findOne({});
        if (!setting) {
            res.status(404).json({
                code: 404,
                message: "Settings not found",
            });
            return;
        }
        const existingSubdomains = setting.subdomain || [];
        const exists = existingSubdomains.some((item) => item.toLowerCase() === subdomain.toLowerCase());
        if (exists) {
            res.status(400).json({
                code: 400,
                message: "Subdomain already exists",
            });
            return;
        }
        existingSubdomains.push(subdomain);
        setting.subdomain = existingSubdomains;
        yield setting.save();
        res.status(200).json({
            code: 200,
            message: "Subdomain created successfully",
            data: setting,
        });
    }
    catch (error) {
        console.error("Error retrieving settings:", error);
        res.status(500).json({
            code: 500,
            message: "Internal server error",
        });
    }
});
exports.createSubdomain = createSubdomain;
const removeSubdomain = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { subdomain } = req.body;
        if (!subdomain) {
            res.status(400).json({
                code: 400,
                message: "Invalid subdomain data",
            });
            return;
        }
        const setting = yield setting_model_1.default.findOne({});
        if (!setting) {
            res.status(404).json({
                code: 404,
                message: "Settings not found",
            });
            return;
        }
        const existingSubdomains = setting.subdomain || [];
        const index = existingSubdomains.findIndex((item) => item.toLowerCase() === subdomain.toLowerCase());
        if (index === -1) {
            res.status(400).json({
                code: 400,
                message: "Subdomain does not exist",
            });
            return;
        }
        existingSubdomains.splice(index, 1);
        setting.subdomain = existingSubdomains;
        yield setting.save();
        res.status(200).json({
            code: 200,
            message: "Subdomain removed successfully",
            data: setting,
        });
    }
    catch (error) {
        console.error("Error retrieving settings:", error);
        res.status(500).json({
            code: 500,
            message: "Internal server error",
        });
    }
});
exports.removeSubdomain = removeSubdomain;
const getSettingClient = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const setting = yield setting_model_1.default.findOne({}).select("siteName companyName logoLight logoDark siteFavicon domain description keywords email phone address facebook instagram twitter youtube");
        if (!setting) {
            res.status(404).json({
                code: 404,
                message: "Settings not found",
            });
            return;
        }
        res.status(200).json({
            code: 200,
            message: "successfully",
            data: setting,
        });
    }
    catch (error) {
        console.error("Error retrieving settings:", error);
        res.status(500).json({
            code: 500,
            message: "Internal server error",
        });
    }
});
exports.getSettingClient = getSettingClient;
