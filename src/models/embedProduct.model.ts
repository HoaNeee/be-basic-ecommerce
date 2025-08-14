import mongoose from "mongoose";

const schema = new mongoose.Schema(
  {
    product_id: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      required: true,
      enum: ["delete", "update"],
    },
  },
  { timestamps: true }
);

const EmbedProduct = mongoose.model("EmbedProduct", schema, "embed-products");

export default EmbedProduct;
