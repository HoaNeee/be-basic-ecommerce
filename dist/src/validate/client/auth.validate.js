"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateProfileValidator = exports.registerValidator = void 0;
const express_validator_1 = require("express-validator");
const authValidator = (req, res, next) => {
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
};
exports.registerValidator = [
    (0, express_validator_1.body)("email")
        .notEmpty()
        .isEmail()
        .withMessage("Email is required and must be a valid email"),
    (0, express_validator_1.body)("password")
        .notEmpty()
        .isString()
        .withMessage("Password is required and must be a string"),
    authValidator,
];
exports.updateProfileValidator = [
    (0, express_validator_1.body)("email")
        .notEmpty()
        .isEmail()
        .withMessage("Email is required and must be a valid email"),
    (0, express_validator_1.body)("firstName")
        .notEmpty()
        .isString()
        .withMessage("First name is required and must be a string"),
    (0, express_validator_1.body)("lastName")
        .notEmpty()
        .isString()
        .withMessage("Last name is required and must be a string"),
    (0, express_validator_1.body)("phone").notEmpty().withMessage("Phone number is required"),
    authValidator,
];
