"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createAddressValidation = void 0;
const express_validator_1 = require("express-validator");
const validateAddress = (req, res, next) => {
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
exports.createAddressValidation = [
    (0, express_validator_1.body)("name").notEmpty().withMessage("Name is required"),
    (0, express_validator_1.body)("phone").notEmpty().withMessage("Phone is required"),
    (0, express_validator_1.body)("houseNo").notEmpty().withMessage("House number is required"),
    (0, express_validator_1.body)("ward").notEmpty().withMessage("Ward is required"),
    (0, express_validator_1.body)("ward.title").notEmpty().withMessage("Ward title is required"),
    (0, express_validator_1.body)("ward.value").notEmpty().withMessage("Ward value is required"),
    (0, express_validator_1.body)("district").notEmpty().withMessage("District is required"),
    (0, express_validator_1.body)("district.title").notEmpty().withMessage("District title is required"),
    (0, express_validator_1.body)("district.value").notEmpty().withMessage("District value is required"),
    (0, express_validator_1.body)("city").notEmpty().withMessage("City is required"),
    (0, express_validator_1.body)("city.title").notEmpty().withMessage("City title is required"),
    (0, express_validator_1.body)("city.value").notEmpty().withMessage("City value is required"),
    validateAddress,
];
