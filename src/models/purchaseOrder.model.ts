import mongoose, { Schema } from "mongoose";

const schema = new Schema(
  {
    products: [
      {
        ref_id: String,
        SKU: String,
        quantity: Number,
        unitCost: Number,
      },
    ],
    status: {
      type: String,
      default: "pending", //pending, confirmed, received, delivering, cancel
    },
    supplier_id: String,
    expectedDelivery: Date,
    receivedAt: Date,
    totalCost: Number,
    typePurchase: {
      type: String,
      default: "regular", //initial -> add new product, regullar -> add new PO, return,...
    },
    deleted: {
      type: Boolean,
      default: false,
    },
    deletedAt: Date,
  },
  { timestamps: true }
);

const PurchaseOrder = mongoose.model(
  "PurchaseOrder",
  schema,
  "purchase-orders"
);

export default PurchaseOrder;
