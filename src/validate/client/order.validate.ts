import { body, validationResult } from "express-validator";
import { Request, Response, NextFunction } from "express";

const validateOrder = (req: Request, res: Response, next: NextFunction) => {
  const errors = validationResult(req);
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

export const changeStatusValidation = [
  body("status")
    .notEmpty()
    .withMessage("Status is required")
    .isIn(["canceled"])
    .withMessage("Invalid status"),
  validateOrder,
];

export const createOrderValidation = [
  body("products")
    .notEmpty()
    .isArray()
    .withMessage("Products must be an array"),
  body("shippingAddress")
    .notEmpty()
    .withMessage("Shipping address is required"),
  body("paymentMethod").notEmpty().withMessage("Payment method is required"),
  validateOrder,
];
