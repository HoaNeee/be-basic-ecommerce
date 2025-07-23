import { Request, Response } from "express";
import User from "../../models/user.model";
import {
  getRefreshToken,
  getAccessToken,
} from "../../../helpers/getAccessToken";
import md5 from "md5";
import * as generate from "../../../helpers/generateString";
import jwt from "jsonwebtoken";
import { MyRequest } from "../../middlewares/admin/auth.middleware";

const timeAccess = 60 * 60 * 5;

// [POST] /auth/login
export const login = async (req: Request, res: Response) => {
  try {
    const { email, password, isRemember } = req.body;

    const user = await User.findOne({ email: email, deleted: false });

    if (!user) {
      throw Error("Email not found!");
    }

    if (md5(password) !== user.password) {
      throw Error("Password not correct!");
    }

    const timeExireIsRemember = 60 * 60 * 24 * 15;
    const timeExire = 60 * 60 * 24 * 1;

    const accessToken = getAccessToken(
      {
        userId: user.id,
        email: email,
        role: user.role,
      },
      timeAccess
    );
    const refreshToken = getRefreshToken(
      {
        userId: user.id,
      },
      isRemember ? timeExireIsRemember : timeExire
    );

    res.json({
      code: 200,
      message: "OK",
      data: {
        userId: user.id,
        fullName: user.fullName || "User",
        role: user.role,
        email: user.email,
        accessToken: accessToken,
        refreshToken: refreshToken,
        avatar: user.avatar,
      },
    });
  } catch (error) {
    res.json({
      code: 400,
      message: error.message,
    });
  }
};

// [POST] /auth/register
export const register = async (req: Request, res: Response) => {
  try {
    const { fullName, email, password } = req.body;

    const existEmail = await User.findOne({ email: email, deleted: false });
    if (existEmail) {
      res.json({
        code: 400,
        message: "Email already exist!",
      });
      return;
    }

    const user = new User({
      email,
      password: md5(password),
      fullName,
    });

    await user.save();
    const timeExire = 60 * 60 * 24;

    const accessToken = getAccessToken(
      {
        userId: user.id,
        email: email,
        role: user.role,
      },
      timeAccess
    );
    const refreshToken = getRefreshToken(
      {
        userId: user.id,
      },
      timeExire
    );

    res.json({
      code: 200,
      message: "OK",
      data: {
        id: user.id,
        fullName: user.fullName,
        role: user.role,
        email: user.email,
        accessToken: accessToken,
        refreshToken: refreshToken,
      },
    });
  } catch (error) {
    res.json({
      code: 500,
      message: "Error in server " + error,
    });
  }
};

// [POST] /auth/google-login
export const googleLogin = async (req: Request, res: Response) => {
  try {
    const { fullname, email } = req.body;

    const timeExire = 60 * 60 * 24 * 7;
    const existUser = await User.findOne({ email: email, deleted: false });

    if (existUser) {
      const accessToken = getAccessToken(
        {
          userId: existUser.id,
          email: email,
          role: existUser.role,
        },
        timeAccess
      );
      const refreshToken = getRefreshToken(
        {
          userId: existUser.id,
        },
        timeExire
      );
      res.json({
        code: 200,
        data: {
          id: existUser.id,
          fullName: existUser.fullName,
          role: existUser.role,
          email: existUser.email,
          accessToken: accessToken,
          refreshToken: refreshToken,
          social: existUser.social,
        },
      });
      return;
    }
    const password = generate.number(6);

    const user = new User({
      fullname,
      email,
      password: md5(password),
      social: "google",
    });

    const accessToken = getAccessToken(
      {
        userId: user.id,
        email: email,
        role: user.role,
      },
      timeAccess
    );
    const refreshToken = getRefreshToken(
      {
        userId: user.id,
      },
      timeExire
    );

    const data = {
      id: user.id,
      fullName: user.fullName,
      role: user.role,
      accessToken: accessToken,
      refreshToken: refreshToken,
      social: user.social,
    };

    await user.save();

    res.json({
      code: 200,
      message: "Successfully",
      data: data,
    });
  } catch (error) {
    res.json({
      code: 500,
      message: error.message,
    });
  }
};

// [POST] /auth/refreshToken
export const refreshToken = async (req: Request, res: Response) => {
  try {
    if (!req.headers.authorization) {
      res.json({
        code: 401,
        message: "Please sent request with token!",
      });
      return;
    }
    const refreshToken = req.headers.authorization.split(" ")[1];

    const decoded: any = jwt.verify(refreshToken, process.env.SECRET_JWT_KEY);
    const userId = decoded.userId;

    const user = await User.findOne({ _id: userId });
    if (!user) {
      res.json({
        code: 404,
        message: "User not found",
      });
      return;
    }

    const newAccessToken = getAccessToken(
      {
        userId: user.id,
        email: user.email,
        role: user.role,
      },
      timeAccess
    );
    res.json({
      code: 200,
      message: "ok",
      accessToken: newAccessToken,
    });
  } catch (error) {
    console.log(error.message);
    res.json({
      code: 403,
      message: error.message,
    });
  }
};

//[GET] /auth/profile
export const profile = async (req: MyRequest, res: Response) => {
  try {
    const user_id = req.userId;

    const user = await User.findOne({ _id: user_id }).select(
      "-password -createdAt -updatedAt"
    );

    res.json({
      code: 200,
      message: "OK",
      data: user,
    });
  } catch (error) {
    res.json({
      code: 400,
      message: error.message,
    });
  }
};

//[PATCH] /auth/profile/edit
export const editProfile = async (req: MyRequest, res: Response) => {
  try {
    const user_id = req.userId;

    const body = req.body;

    await User.updateOne({ _id: user_id }, body);

    res.json({
      code: 200,
      message: "Update success!",
    });
  } catch (error) {
    res.json({
      code: 400,
      message: error.message,
    });
  }
};

//[PATCH] /auth/profile/change-password
export const changePassword = async (req: MyRequest, res: Response) => {
  try {
    const user_id = req.userId;

    const { password, newPassword, confirmPassword } = req.body;

    const user = await User.findOne({ _id: user_id });

    if (newPassword !== confirmPassword) {
      throw Error("The confirm password do not match!");
    }
    if (md5(password) !== user.password) {
      throw Error("Current Password is not correct!");
    }

    user.password = md5(newPassword);

    await user.save();

    // await User.updateOne({ _id: user_id }, body);

    res.json({
      code: 200,
      message: "Update success!",
    });
  } catch (error) {
    res.json({
      code: 400,
      message: error.message,
    });
  }
};
