"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateTrackSuggestion = exports.validatorTrackSuggestion = void 0;
const express_validator_1 = require("express-validator");
exports.validatorTrackSuggestion = [
    (0, express_validator_1.body)("action")
        .isString()
        .withMessage("Action is required and must be a string"),
    (0, express_validator_1.body)("value")
        .isString()
        .withMessage("Value is required and must be a string"),
    (0, express_validator_1.body)("type_track")
        .isString()
        .withMessage("Type is required and must be a string"),
    (req, res, next) => {
        const errors = (0, express_validator_1.validationResult)(req);
        if (!errors.isEmpty()) {
            res.status(400).json({
                code: 400,
                message: "Validation failed",
                errors: errors.array(),
            });
            return;
        }
        next();
    },
];
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
