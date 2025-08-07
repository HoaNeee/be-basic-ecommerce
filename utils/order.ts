import Product from "../src/models/product.model";
import SubProduct from "../src/models/subProduct.model";
import { Order } from "../src/types/order.types";

export const updateStockWhenOrder = async (
  order: Order | any,
  type: "plus" | "minus"
) => {
  const skus = order.products.map((item) => item.SKU);

  const products = await Product.find({ SKU: { $in: skus }, deleted: false });
  const subProducts = await SubProduct.find({
    SKU: { $in: skus },
    deleted: false,
  });

  let direc = 1;
  if (type === "minus") {
    direc = -1;
  }

  for (const product of order.products) {
    const sku = product.SKU;
    const quantity = product.quantity * direc;
    if (product.options && product.options.length > 0) {
      const sub = subProducts.find((it) => it.SKU === sku);
      if (sub) {
        sub.stock += quantity;
        await sub.save();
      }
    } else {
      const pro = products.find((it) => it.SKU === sku);
      if (pro) {
        pro.stock += quantity;
        await pro.save();
      }
    }
  }
};

export const statusOrder = (status: string) => {
  switch (status) {
    case "pending":
      return {
        image:
          "https://res.cloudinary.com/dlogl1cn7/image/upload/v1752983399/icons8-box-64_1_m2qysd.png",
        title: "",
        body: "",
      };
    case "confirmed":
      return {
        image:
          "https://res.cloudinary.com/dlogl1cn7/image/upload/v1752937812/icons8-hand-box-64_atuazm.png",
        title: "Your order has been " + status,
        body: "Please check and confirm your order.",
      };
    case "shipping":
      return {
        image:
          "https://res.cloudinary.com/dlogl1cn7/image/upload/v1752937813/icons8-shipping-48_dbdmat.png",
        title: "Your order is " + status,
        body: "Your order is being shipped to you.",
      };
    case "delivered":
      return {
        image:
          "https://res.cloudinary.com/dlogl1cn7/image/upload/v1752937812/icons8-delivered-64_q7woyx.png",
        title: "Your order has been " + status,
        body: "Thank you for buying our products.",
      };
    case "canceled":
      return {
        image:
          "https://res.cloudinary.com/dlogl1cn7/image/upload/v1752937812/icons8-box-48_zlu6wl.png",
        title: "Your order has been " + status,
        body: "We sincerely apologize for the bad experience.",
      };

    default:
      return {
        image:
          "https://res.cloudinary.com/dlogl1cn7/image/upload/v1752983399/icons8-box-64_1_m2qysd.png",
        title: "",
        body: "",
      };
  }
};
