import { Request, Response, NextFunction } from "express";
import { TrackSuggestionRequest } from "../../types/suggestion.types";
import { body, validationResult } from "express-validator";

export const validatorTrackSuggestion = [
  body("action")
    .isString()
    .withMessage("Action is required and must be a string"),
  body("value")
    .isString()
    .withMessage("Value is required and must be a string"),
  body("type_track")
    .isString()
    .withMessage("Type is required and must be a string"),
  (req: Request, res: Response, next: NextFunction) => {
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
  },
];

export const validateTrackSuggestion = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const { action, value, type_track }: TrackSuggestionRequest = req.body;

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
