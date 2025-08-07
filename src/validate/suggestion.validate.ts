import { Request, Response, NextFunction } from "express";
import { TrackSuggestionRequest } from "../types/suggestion.types";

const TRACK_TYPES = {
  PRODUCT: "product",
  BLOG: "blog",
} as const;

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
