import { Request, Response } from "express";
import { MyRequest } from "../../middlewares/client/auth.middleware";
import Cart from "../../models/cart.model";
import CartDetail from "../../models/cartDetail.model";
import SubProduct from "../../models/subProduct.model";
import Product from "../../models/product.model";
import VariationOption from "../../models/variationOption.model";

// [GET] /cart
export const getCart = async (req: MyRequest, res: Response) => {
  try {
    const user_id = req.userId;

    let cart = await Cart.findOne({ user_id: user_id }).select(
      "-deleted -deletedAt"
    );

    if (!cart) {
      cart = new Cart({
        user_id: user_id,
      });
      await cart.save();
    }

    const cartItems = await CartDetail.find({ cart_id: cart.id }).lean();

    const productIds = cartItems.map((item) => item.product_id);
    const subIds = cartItems.map((item) => item.sub_product_id);

    const products = await Product.find({
      _id: { $in: productIds },
      deleted: false,
    });
    const subProducts = await SubProduct.find({
      _id: { $in: subIds },
      deleted: false,
    });

    for (const item of cartItems) {
      const indexProduct = products.findIndex(
        (pro) => pro.id === item.product_id
      );
      item["cartItem_id"] = item._id;
      if (indexProduct !== -1) {
        item["thumbnail"] = products[indexProduct].thumbnail;
        item["title"] = products[indexProduct].title;
        item["slug"] = products[indexProduct].slug;
        item["cost"] = products[indexProduct].cost;
      }
      if (item.options.length > 0) {
        const indexSub = subProducts.findIndex(
          (sub) => sub.id === item.sub_product_id
        );
        const options_info = [];
        for (const option_id of item.options) {
          const option = await VariationOption.findOne({ _id: option_id });
          if (option) {
            options_info.push({
              title: option.title,
              value: option.id,
              variation_id: option.variation_id,
            });
          }
        }
        item["options_info"] = [...options_info];

        if (indexSub !== -1) {
          item["thumbnail"] = subProducts[indexSub].thumbnail;
          item["price"] = subProducts[indexSub].price;
          item["discountedPrice"] = subProducts[indexSub].discountedPrice;
          item["stock"] = subProducts[indexSub].stock;
          item["cost"] = subProducts[indexSub].cost;
          item["SKU"] = subProducts[indexSub].SKU;
          item["thumbnail_product"] = subProducts[indexSub].thumbnail;
        }
      } else {
        item["price"] = products[indexProduct].price;
        item["discountedPrice"] = products[indexProduct].discountedPrice;
        item["stock"] = products[indexProduct].stock;
        item["SKU"] = products[indexProduct].SKU;
      }
      if (!item["SKU"]) {
        item["SKU"] = products[indexProduct].SKU;
      }
    }

    res.json({
      code: 200,
      message: "Cart ok!!",
      data: {
        carts: cartItems,
        cart_id: cart.id,
      },
    });
  } catch (error) {
    console.log(error);
    res.json({
      code: 400,
      message: error.message || error,
    });
  }
};

// [POST] /cart/add-product/:cartId
export const addProduct = async (req: MyRequest, res: Response) => {
  try {
    const cart_id = req.params.cartId;
    const cart_id_in_session = req.cartId;
    const { productType } = req.body;

    if (!cart_id) {
      throw Error("Missing cart_id");
    }

    if (cart_id !== cart_id_in_session) {
      res.status(403).json({
        code: 403,
        message: "Forbidden",
      });
      return;
    }

    const body = req.body;

    let cart: any;

    const product_id = body.product_id;
    if (!product_id) {
      res.status(400).json({
        code: 400,
        message: "Missing product_id",
      });
      return;
    }

    if (productType === "simple") {
      const cartItem = await CartDetail.findOne({
        cart_id: cart_id,
        product_id: product_id,
      });
      if (cartItem) {
        cartItem.quantity = cartItem.quantity + body.quantity;
        await cartItem.save();
        cart = cartItem.toObject();
      } else {
        const newItem = new CartDetail({
          ...body,
          cart_id: cart_id,
          product_id: product_id,
        });
        await newItem.save();
        cart = newItem.toObject();
      }
    } else {
      const sub_product_id = body.sub_product_id;

      const cartItem = await CartDetail.findOne({
        cart_id: cart_id,
        sub_product_id: sub_product_id,
      });
      if (cartItem) {
        cartItem.quantity = cartItem.quantity + body.quantity;
        await cartItem.save();
        cart = cartItem.toObject();
      } else {
        const newItem = new CartDetail({
          ...body,
          cart_id: cart_id,
          product_id: product_id,
          sub_product_id: sub_product_id,
        });
        await newItem.save();
        cart = newItem.toObject();
      }
    }

    res.json({
      code: 200,
      message: "Success!!",
      data: {
        cartItem: {
          ...cart,
          cartItem_id: String(cart._id),
        },
      },
    });
  } catch (error) {
    console.log(error);
    res.json({
      code: 400,
      message: error.message || error,
    });
  }
};

// [PATCH] /cart/update-quantity/:cartItemId
export const updateQuantity = async (req: MyRequest, res: Response) => {
  try {
    const cartItem_id = req.params.cartItemId;
    const cart_id = req.cartId;
    const quantity = req.body.quantity;

    if (!cartItem_id) {
      throw Error("Missing cart_item_id!");
    }

    const cart = await CartDetail.findOne({ _id: cartItem_id, cart_id });

    if (!cart) {
      throw Error("Cart item not found!");
    }

    cart.quantity += quantity;
    await cart.save();

    res.json({
      code: 200,
      message: "Success!!",
      data: {},
    });
  } catch (error) {
    console.log(error);
    res.json({
      code: 400,
      message: error.message || error,
    });
  }
};

// [PATCH] /cart/change-subProduct/:cartItemId
export const changeSubProduct = async (req: MyRequest, res: Response) => {
  try {
    const cartItem_id = req.params.cartItemId;
    const cart_id = req.cartId;

    const body = req.body;

    if (!cartItem_id) {
      throw Error("Missing cart_item_id!");
    }

    const cart = await CartDetail.findOne({ _id: cartItem_id, cart_id });

    if (!cart) {
      throw Error("Cart item not found!");
    }

    cart.sub_product_id = body._id;
    cart.options = [...body.options];

    await cart.save();

    res.json({
      code: 200,
      message: "Success!!",
      data: {},
    });
  } catch (error) {
    console.log(error);
    res.json({
      code: 400,
      message: error.message || error,
    });
  }
};

// [DELETE] /cart/delete/:cartItemId
export const remove = async (req: MyRequest, res: Response) => {
  try {
    const cartItem_id = req.params.cartItemId;
    const cart_id = req.cartId;

    if (!cartItem_id) {
      throw Error("Missing cart_item_id!");
    }

    await CartDetail.deleteOne({ _id: cartItem_id, cart_id });

    res.json({
      code: 200,
      message: "Success!!",
      data: {},
    });
  } catch (error) {
    console.log(error);
    res.json({
      code: 400,
      message: error.message || error,
    });
  }
};
