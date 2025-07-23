import { Request, Response } from "express";
import {
  getRefreshToken,
  getAccessToken,
} from "../../../helpers/getAccessToken";
import md5 from "md5";
import * as generate from "../../../helpers/generateString";
import jwt from "jsonwebtoken";
import Customer from "../../models/customer.model";
import { MyRequest } from "../../middlewares/client/auth.middleware";
import Cart from "../../models/cart.model";
import Notification from "../../models/notification.model";

// [POST] /auth/login
export const login = async (req: Request, res: Response) => {
  try {
    const { email, password, isRemember } = req.body;
    const user = await Customer.findOne({ email: email, deleted: false });

    if (!user) {
      throw Error("Email not found!!");
    }

    if (md5(password) !== user.password) {
      throw Error("Password not correct!!");
    }

    // const timeExire = 60 * 60 * 24 * 1;

    const cart = await Cart.findOne({ user_id: user.id, deleted: false });

    if (!cart) {
      const newCart = new Cart({
        user_id: user.id,
      });
      await newCart.save();
    }

    const accessToken = getAccessToken({
      userId: user.id,
    });

    res.cookie("jwt_token", accessToken, {
      secure: true,
      httpOnly: true,
      sameSite: "none",
      path: "/",
      maxAge: isRemember ? 1000 * 60 * 60 * 24 * 15 : undefined,
      domain: ".kakrist.site",
    });

    res.json({
      code: 200,
      message: "Login success!",
      data: {
        isLogin: true,
        firstName: user.firstName,
        lastName: user.lastName,
        user_id: user.id,
        avatar: user.avatar,
        phone: user.phone,
        email: user.email,
        setting: user.setting,
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
    const email = req.body.email;

    const exits = await Customer.findOne({ email: email, deleted: false });
    if (exits) {
      throw Error("Email already existing!!");
    }

    req.body.password = md5(req.body.password);

    if (!req.body.firstName && !req.body.lastName) {
      const num = await Customer.countDocuments();
      req.body.firstName = "User";
      req.body.lastName = num + 1;
    }
    const customer = new Customer(req.body);

    await customer.save();

    res.json({
      code: 200,
      message: "Register successfully!!",
    });
  } catch (error) {
    res.json({
      code: 400,
      message: error.message,
    });
  }
};

// [GET] /auth/profile/edit
export const updateProfile = async (req: MyRequest, res: Response) => {
  try {
    const user_id = req.userId;

    const body = req.body;

    const customer = await Customer.findByIdAndUpdate(user_id, body);

    // await Customer.updateOne({ _id: user_id }, body);

    const notify = new Notification({
      user_id: user_id,
      type: "profile",
      title: "Profile Updated",
      body: "You just updated your profile",
      image: body.avatar || customer.avatar,
      receiver: "customer",
    });

    await notify.save();

    res.json({
      code: 200,
      message: "Update profile success!",
    });
  } catch (error) {
    res.json({
      code: 400,
      message: error.message,
    });
  }
};
// [GET] /auth/profile
export const getInfo = async (req: MyRequest, res: Response) => {
  try {
    // console.log(req.cookies);

    const user_id = req.userId;

    const customer = await Customer.findOne({
      _id: user_id,
      deleted: false,
    })
      .select("-password -createdAt -updatedAt -deleted")
      .lean(); //status,...

    if (!customer) {
      throw Error("Not allowed!");
    }

    res.json({
      code: 200,
      message: "Get info OK!",
      data: {
        ...customer,
        user_id: customer._id,
      },
    });
  } catch (error) {
    res.json({
      code: 400,
      message: error.message,
    });
  }
};

// [POST] /auth/logout
export const logout = async (req: Request, res: Response) => {
  try {
    res.clearCookie("jwt_token");

    res.json({
      code: 200,
      message: "Logout success!",
    });
  } catch (error) {
    res.json({
      code: 400,
      message: error.message,
    });
  }
};

// [GET] /auth/profile/change-password
export const changePassword = async (req: MyRequest, res: Response) => {
  try {
    const user_id = req.userId;

    const { password, newPassword, confirmPassword } = req.body;

    const customer = await Customer.findOne({ _id: user_id });

    if (newPassword !== confirmPassword) {
      throw Error("Confirm password do not match!");
    }

    if (customer.password !== md5(password)) {
      throw Error("Password is not correct!");
    }

    customer.password = md5(newPassword);

    await customer.save();

    const notify = new Notification({
      user_id: customer.id,
      type: "profile",
      title: "Password Update successfully",
      body: "Your password has been updated successfully",
      image: customer.avatar,
      receiver: "customer",
    });

    await notify.save();

    res.json({
      code: 200,
      message: "Change password success!",
    });
  } catch (error) {
    res.json({
      code: 400,
      message: error.message,
    });
  }
};

// [GET] /auth/profile/change-setting
export const changeSetting = async (req: MyRequest, res: Response) => {
  try {
    const user_id = req.userId;

    const body = req.body;

    const customer = await Customer.findOne({ _id: user_id });

    customer.setting = body;

    await customer.save();

    res.json({
      code: 200,
      message: "success!",
    });
  } catch (error) {
    res.json({
      code: 400,
      message: error.message,
    });
  }
};
