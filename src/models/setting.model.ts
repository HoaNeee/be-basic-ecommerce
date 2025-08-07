import mongoose from "mongoose";

const schema = new mongoose.Schema(
  {
    siteName: { type: String, required: true },
    companyName: { type: String, required: true },
    logoLight: { type: String, required: false },
    logoDark: { type: String, required: false },
    siteFavicon: { type: String, required: false },

    domain: { type: String, required: true },
    subdomain: { type: Array, required: false },
    description: { type: String, required: true },
    keywords: { type: Array, required: false },

    email: { type: String, required: true },
    phone: { type: String, required: false },
    address: { type: String, required: false },

    facebook: { type: String, required: false },
    instagram: { type: String, required: false },
    twitter: { type: String, required: false },
    youtube: { type: String, required: false },

    timezone: { type: String, required: false, default: "UTC" },
    language: { type: String, required: false, default: "en" },
    currency: { type: String, required: false, default: "USD" },

    metaTitle: { type: String, required: true },
    metaDescription: { type: String, required: true },
    ogImage: { type: String, required: false },

    googleAnalyticsId: { type: String, required: false },
    facebookPixelId: { type: String, required: false },

    // Email Configuration (SMTP)
    smtpHost: { type: String, required: false },
    smtpPort: { type: Number, required: false },
    smtpUsername: { type: String, required: false },
    smtpPassword: { type: String, required: false },
  },
  {
    timestamps: true,
  }
);

const Setting = mongoose.model("Setting", schema, "setting");

export default Setting;
