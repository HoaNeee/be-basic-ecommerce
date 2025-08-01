import { Request, Response } from "express";
import { getAccessToken } from "../../../helpers/getAccessToken";
import md5 from "md5";
import Customer from "../../models/customer.model";
import { MyRequest } from "../../middlewares/client/auth.middleware";
import Cart from "../../models/cart.model";
import Notification from "../../models/notification.model";

let enviroment = process.env.NODE_ENV || "dev";

export const clearCookie = (res: Response) => {
  if (enviroment === "dev") {
    res.clearCookie("jwt_token", {
      path: "/",
    });
    return;
  }

  //production
  res.clearCookie("jwt_token", {
    secure: true,
    httpOnly: true,
    sameSite: "none",
    path: "/",
    domain: ".kakrist.site",
  });
};

const setCookie = (res: Response, accessToken: string, maxAge?: number) => {
  if (enviroment === "dev") {
    res.cookie("jwt_token", accessToken, {
      secure: false,
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: maxAge || undefined,
    });
    return;
  }

  //production
  res.cookie("jwt_token", accessToken, {
    secure: true,
    httpOnly: true,
    sameSite: "none",
    path: "/",
    maxAge: maxAge || undefined,
    domain: ".kakrist.site", // -> production
  });
};

// [POST] /auth/login
export const login = async (req: Request, res: Response) => {
  try {
    const { email, password, isRemmember } = req.body;
    const user = await Customer.findOne({ email: email, deleted: false });

    if (!user) {
      throw Error("Email not found!!");
    }

    if (md5(password) !== user.password) {
      throw Error("Password not correct!!");
    }

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

    setCookie(
      res,
      accessToken,
      isRemmember ? 1000 * 60 * 60 * 24 * 15 : undefined
    );

    req.session["has_welcome"] = false;

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

    const exists = await Customer.findOne({ email: email, deleted: false });

    //check email exists or login with social later
    if (exists) {
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

    const customer = await Customer.findOne({ _id: user_id, deleted: false });

    const notify = new Notification({
      user_id: user_id,
      type: "profile",
      title: "Profile Updated",
      body: "You just updated your profile",
      image: body.avatar || customer.avatar,
      receiver: "customer",
    });

    if (customer.provider === "google") {
      customer.phone = body.phone || customer.phone;
      await customer.save();
      res.json({
        code: 200,
        message: "Update profile success!",
      });
      return;
    }

    await Customer.updateOne({ _id: user_id }, body);

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

    if (
      req.session["has_welcome"] === undefined ||
      req.session["has_welcome"] === null
    ) {
      req.session["has_welcome"] = true;
    } else {
      req.session["has_welcome"] = false;
    }

    res.json({
      code: 200,
      message: "Get info OK!",
      data: {
        ...customer,
        user_id: customer._id,
        has_welcome: req.session["has_welcome"],
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
    clearCookie(res);

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

// [POST] /auth/google
export const googleLogin = async (req: Request, res: Response) => {
  try {
    const code = req.body.code;

    if (!code) {
      res.json({
        code: 400,
        message: "Missing code",
      });
      return;
    }

    const userInfo = await handleInfoUser(code);

    const email = userInfo.email;
    const avatar = userInfo.picture || "";
    const name = userInfo.name.split(" ");
    const firstName = userInfo.given_name
      ? userInfo.given_name
      : name?.length > 0
      ? name[0]
      : "";
    const lastName = userInfo.family_name
      ? userInfo.family_name
      : name?.length > 1
      ? name[1]
      : "";
    const providerId = userInfo.sub;

    const exist = await Customer.findOne({
      email: email,
      deleted: false,
    });

    const timeCookie = 1000 * 60 * 60 * 24 * 5; //5 days

    req.session["has_welcome"] = false;

    if (exist) {
      if (exist.provider === "google" && exist.providerId === providerId) {
        await Customer.updateOne(
          {
            _id: exist.id,
          },
          {
            avatar: avatar,
            firstName: firstName,
            lastName: lastName,
          }
        );

        //set cookie here
        const accessToken = getAccessToken({
          userId: exist.id,
        });

        setCookie(res, accessToken, timeCookie);

        res.json({
          code: 200,
          message: "Google login success!",
          data: {
            isLogin: true,
            firstName: firstName,
            lastName: lastName,
            user_id: exist.id,
            avatar: avatar,
            phone: exist.phone,
            email: exist.email,
            setting: exist.setting,
            provider: exist.provider,
          },
        });

        return;
      } else {
        //Conflict -> DO THEN
        // res.json({
        //   code: 409, // Conflict,
        //   message:
        //     "Email already exists with another provider, need linking with an existing account!",
        // });

        const accessToken = getAccessToken({
          userId: exist.id,
        });

        setCookie(res, accessToken, timeCookie);

        res.json({
          code: 200,
          message: "Login google success!",
          data: {
            isLogin: false,
            firstName: exist.firstName,
            lastName: exist.lastName,
            user_id: exist.id,
            avatar: exist.avatar,
            phone: exist.phone,
            email: exist.email,
            setting: exist.setting,
            provider: exist.provider,
          },
        });
        return;
      }
    }

    const customer = new Customer({
      firstName: firstName,
      lastName: lastName,
      email: email,
      avatar: avatar,
      password: null,
      provider: "google",
      providerId: providerId,
      social: {
        google: true,
      },
    });

    await customer.save();

    //create cart for customer here
    const newCart = new Cart({
      user_id: customer.id,
    });

    await newCart.save();

    //set cookie here
    const accessToken = getAccessToken({
      userId: customer.id,
    });

    setCookie(res, accessToken, timeCookie);

    res.json({
      code: 200,
      message: "Google login success!",
      data: {
        isLogin: true,
        firstName: customer.firstName,
        lastName: customer.lastName,
        user_id: customer.id,
        avatar: customer.avatar,
        phone: customer.phone,
        email: customer.email,
        setting: customer.setting,
        provider: customer.provider,
      },
    });
  } catch (error) {
    res.json({
      code: 500,
      message: error.message,
    });
  }
};

const handleInfoUser = async (code: string) => {
  //link token https://oauth2.googleapis.com/token
  //link info https://www.googleapis.com/oauth2/v3/userinfo

  try {
    const uri =
      enviroment === "dev"
        ? "https://localhost:3000/auth/google"
        : "https://shop.kakrist.site/auth/google";

    const params = new URLSearchParams({
      code,
      client_id: process.env.GOOGLE_CLIENT_ID || "",
      client_secret: process.env.GOOGLE_CLIENT_SECRET || "",
      redirect_uri: uri,
      grant_type: "authorization_code",
    });

    const response = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: params.toString(),
    });

    if (!response.ok) {
      throw Error("Failed to exchange code for access token");
    }

    const data = await response.json();

    const info = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${data.access_token}`,
      },
    });

    if (!info.ok) {
      throw Error("Failed to fetch user info");
    }

    return await info.json();
  } catch (error) {
    throw new Error(`Error fetching user info: ${error.message}`);
  }
};
