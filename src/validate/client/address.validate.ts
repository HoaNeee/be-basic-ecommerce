import { body, validationResult } from "express-validator";
import { Request, Response, NextFunction } from "express";

const validateAddress = (req: Request, res: Response, next: NextFunction) => {
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

export const createAddressValidation = [
  body("name").notEmpty().withMessage("Name is required"),
  body("phone").notEmpty().withMessage("Phone is required"),
  body("houseNo").notEmpty().withMessage("House number is required"),
  body("ward").notEmpty().withMessage("Ward is required"),
  body("ward.title").notEmpty().withMessage("Ward title is required"),
  body("ward.value").notEmpty().withMessage("Ward value is required"),
  body("district").notEmpty().withMessage("District is required"),
  body("district.title").notEmpty().withMessage("District title is required"),
  body("district.value").notEmpty().withMessage("District value is required"),
  body("city").notEmpty().withMessage("City is required"),
  body("city.title").notEmpty().withMessage("City title is required"),
  body("city.value").notEmpty().withMessage("City value is required"),
  validateAddress,
];
