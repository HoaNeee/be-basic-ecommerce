import Pagination from "../helpers/pagination";
import Category from "../src/models/category.model";
import Order from "../src/models/order.model";
import Product from "../src/models/product.model";
import SubProduct from "../src/models/subProduct.model";
import SubProductOption from "../src/models/subProductOption.model";
import VariationOption from "../src/models/variationOption.model";
import { Request } from "express";

enum ProductType {
  SIMPLE = "simple",
  VARIATION = "variations",
}

export const solvePriceStock = async (product: any, subProducts: any) => {
  let min = Infinity,
    max = 0,
    stock = 0;
  for (const sub of subProducts) {
    stock += sub.stock;
    min = Math.min(min, sub.price);
    max = Math.max(max, sub.price);
  }
  product[`rangePrice`] = {
    min: min,
    max: max,
  };
  product[`rangeStock`] = stock;
};

export const solveOptionSubProduct = async (
  subProducts: any[],
  key?: string
) => {
  const subIds = subProducts.map((it) => String(it._id));

  const subOptions = await SubProductOption.find({
    sub_product_id: { $in: subIds },
    deleted: false,
  });
  const subOptionIds = subOptions.map((it) => it.variation_option_id);
  const options = await VariationOption.find({ _id: { $in: subOptionIds } });

  const subOptionMap = new Map();

  for (const subOption of subOptions) {
    const opt = options.find((it) => it.id === subOption.variation_option_id);
    if (subOptionMap.has(subOption.sub_product_id)) {
      const options_info = subOptionMap.get(subOption.sub_product_id);
      options_info.push({
        title: opt.title,
        value: opt.id,
      });
    } else {
      subOptionMap.set(subOption.sub_product_id, [
        {
          title: opt.title,
          value: opt.id,
        },
      ]);
    }
  }

  for (const sub of subProducts) {
    const options_info = subOptionMap.get(String(sub._id));
    sub[key || "options_info"] = options_info;
  }
};

export const getTopSellHelper = async (req: Request, limit?: number) => {
  let find = {
    deleted: false,
  };

  const orders = await Order.find(find);

  const productMap = new Map();

  for (const order of orders) {
    const products = order.products;
    for (const product of products) {
      const sku = product.SKU;
      if (sku) {
        if (productMap.has(sku)) {
          const obj = productMap.get(sku);
          obj.soldQuantity += product.quantity;
          productMap.set(sku, { ...obj });
        } else {
          productMap.set(sku, {
            soldQuantity: product.quantity,
            orderedPrice: product.price,
            SKU: product.SKU,
            options: product.options,
            title: product.title,
          });
        }
      }
    }
  }

  const skus = [...productMap.keys()];

  const subProducts = await SubProduct.find({
    deleted: false,
    SKU: { $in: skus },
  });

  const products = await Product.find({
    deleted: false,
  })
    .select("-createdAt -updateAt")
    .lean();

  let response = [];

  for (const product of products) {
    const sku = product.SKU;
    const obj = productMap.get(sku);
    if (obj) {
      productMap.set(sku, {
        ...product,
        ...obj,
        remaining: product.stock,
        product_id: String(product._id),
      });
    }
  }
  for (const sub of subProducts) {
    const sku = sub.SKU;
    const obj = productMap.get(sku);
    if (obj) {
      const product = products.find((it) => String(it._id) === sub.product_id);

      productMap.set(sku, {
        ...product,
        ...obj,
        remaining: sub.stock,
        product_id: sub.product_id,
      });
    }
  }

  productMap.forEach((val, key) => {
    response.push(val);
  });

  response = response.sort((a, b) => b.soldQuantity - a.soldQuantity);

  const totalRecord = response.length;

  const initObjectPagination = {
    page: 1,
    limitItems: limit || totalRecord,
  };

  if (req.query.limit) {
    initObjectPagination.limitItems = Number(req.query.limit);
  }

  const objPagination = Pagination(
    initObjectPagination,
    req.query,
    totalRecord
  );

  const skip = objPagination.skip;

  const newResponse = [];
  const products_info = [];
  const map = new Map();

  for (
    let i = skip;
    i < Math.min(totalRecord, skip + objPagination.limitItems);
    i++
  ) {
    const item = response[i];
    const categories_info = await Category.find({
      _id: { $in: item.categories },
      deleted: false,
    }).lean();
    item["categories_info"] = categories_info;
    newResponse.push(item);
    if (!map.has(item.product_id)) {
      if (item.productType === ProductType.VARIATION) {
        const subProducts = await SubProduct.find({
          deleted: false,
          product_id: item.product_id,
        });
        solvePriceStock(item, subProducts);
      }
      products_info.push(item);
      map.set(item.product_id, true);
    }
  }

  if (products_info.length < objPagination.limitItems) {
    const len = objPagination.limitItems - products_info.length;
    let i = 0,
      curr_len = 0;
    const ids = [...map.keys()];
    while (curr_len < len) {
      while (ids.includes(String(products[i]._id))) {
        ++i;
      }
      ids.push(String(products[i]._id));
      if (products[i].productType === ProductType.VARIATION) {
        const subProducts = await SubProduct.find({
          product_id: String(products[i]._id),
        });
        solvePriceStock(products[i], subProducts);
      }
      products_info.push(products[i]);
      ++curr_len;
    }
  }

  return {
    products: newResponse,
    products_info: products_info,
    totalRecord,
    totalPage: objPagination.totalPage,
  };
};
