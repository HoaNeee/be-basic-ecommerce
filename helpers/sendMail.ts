import nodemailer from "nodemailer";
import { MyRequest } from "../src/middlewares/client/auth.middleware";

export const sendMail = (
  email: string,
  subject: any,
  html: any,
  req: MyRequest
) => {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: req.setting.smtpUsername || process.env.USER_EMAIL,
      pass: req.setting.smtpPassword || process.env.USER_PASSWORD,
    },
    port: req.setting.smtpPort || 465,
    secure: req.setting.smtpPort === 465,
    host: req.setting.smtpHost || "smtp.gmail.com",
  });

  const mailOptions = {
    from: req.setting.smtpUsername || process.env.USER_EMAIL,
    to: email,
    subject: subject,
    html: html, // HTML body
  };

  transporter.sendMail(mailOptions, function (error, info) {
    if (error) {
      console.log(error);
    } else {
      console.log("Email sent : " + info.response);
    }
  });
};
