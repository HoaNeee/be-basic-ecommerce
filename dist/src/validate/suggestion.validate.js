"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateTrackSuggestion = void 0;
const TRACK_TYPES = {
    PRODUCT: "product",
    BLOG: "blog",
};
const validateTrackSuggestion = (req, res, next) => {
    const { action, value, type_track } = req.body;
    if (!action || typeof action !== "string") {
        res.status(400).json({
            code: 400,
            message: "Action is required and must be a string",
        });
        return;
    }
    if (!value || typeof value !== "string") {
        res.status(400).json({
            code: 400,
            message: "Value is required and must be a string",
        });
        return;
    }
    next();
};
exports.validateTrackSuggestion = validateTrackSuggestion;
