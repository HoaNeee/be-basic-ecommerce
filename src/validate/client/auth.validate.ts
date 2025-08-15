import { body, validationResult } from "express-validator";
import { Request, Response, NextFunction } from "express";

const authValidator = (req: Request, res: Response, next: NextFunction) => {
  const errors = validationResult(req);
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

export const registerValidator = [
  body("email")
    .notEmpty()
    .isEmail()
    .withMessage("Email is required and must be a valid email"),
  body("password")
    .notEmpty()
    .isString()
    .withMessage("Password is required and must be a string"),
  authValidator,
];

export const updateProfileValidator = [
  body("email")
    .notEmpty()
    .isEmail()
    .withMessage("Email is required and must be a valid email"),
  body("firstName")
    .notEmpty()
    .isString()
    .withMessage("First name is required and must be a string"),
  body("lastName")
    .notEmpty()
    .isString()
    .withMessage("Last name is required and must be a string"),
  body("phone").notEmpty().withMessage("Phone number is required"),
  authValidator,
];
