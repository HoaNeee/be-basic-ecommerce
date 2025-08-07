"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendMail = void 0;
const nodemailer_1 = __importDefault(require("nodemailer"));
const sendMail = (email, subject, html, req) => {
    const transporter = nodemailer_1.default.createTransport({
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
        html: html,
    };
    transporter.sendMail(mailOptions, function (error, info) {
        if (error) {
            console.log(error);
        }
        else {
            console.log("Email sent : " + info.response);
        }
    });
};
exports.sendMail = sendMail;
