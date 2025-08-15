"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createOrderValidation = exports.changeStatusValidation = void 0;
const express_validator_1 = require("express-validator");
const validateOrder = (req, res, next) => {
    const errors = (0, express_validator_1.validationResult)(req);
    console.log(errors);
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
exports.changeStatusValidation = [
    (0, express_validator_1.body)("status")
        .notEmpty()
        .withMessage("Status is required")
        .isIn(["canceled"])
        .withMessage("Invalid status"),
    validateOrder,
];
exports.createOrderValidation = [
    (0, express_validator_1.body)("products")
        .notEmpty()
        .isArray()
        .withMessage("Products must be an array"),
    (0, express_validator_1.body)("shippingAddress")
        .notEmpty()
        .withMessage("Shipping address is required"),
    (0, express_validator_1.body)("paymentMethod").notEmpty().withMessage("Payment method is required"),
    validateOrder,
];
