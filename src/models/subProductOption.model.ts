import mongoose, { Schema } from "mongoose";

const schema = new Schema(
  {
    variation_option_id: {
      type: String,
      required: true,
    },
    sub_product_id: {
      type: String,
      required: true,
    },
    deleted: {
      type: Boolean,
      default: false,
    },
    deletedAt: Date,
  },
  { timestamps: true }
);

const SubProductOption = mongoose.model(
  "SubProductOption",
  schema,
  "sub-product-options"
);

export default SubProductOption;
