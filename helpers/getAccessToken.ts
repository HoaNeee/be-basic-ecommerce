import jwt from "jsonwebtoken";

export const getAccessToken = (
  payload: {
    userId: string;
    email?: string;
    role?: string;
  },
  expire?: number
) => {
  const token = jwt.sign(
    payload,
    process.env.SECRET_JWT_KEY,
    expire && {
      expiresIn: expire,
    }
  );

  return token;
};

export const getRefreshToken = (
  payload: {
    userId: string;
  },
  expire?: number
) => {
  const token = jwt.sign(payload, process.env.SECRET_JWT_KEY, {
    expiresIn: expire ?? undefined,
  });
  return token;
};
