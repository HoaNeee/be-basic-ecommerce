import { Request, Response } from "express";
import Pagination from "../../../helpers/pagination";
import SubProduct from "../../models/subProduct.model";
import SubProductOption from "../../models/subProductOption.model";
import Product from "../../models/product.model";
import Variation from "../../models/variation.model";
import VariationOption from "../../models/variationOption.model";
import Order from "../../models/order.model";
import Category from "../../models/category.model";

enum ProductType {
  SIMPLE = "simple",
  VARIATION = "variations",
}

export const solvePriceStock = (product: any, subProducts: any) => {
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

const merge = (arr1: any[], arr2: any[]) => {
  let i = 0,
    j = 0;
  const len1 = arr1.length,
    len2 = arr2.length;
  const res = [];
  while (i < len1 && j < len2) {
    if (arr1[i].stock <= arr2[j].stock) {
      res.push(arr1[i]);
      ++i;
    } else {
      res.push(arr2[j]);
      ++j;
    }
  }

  while (i < len1) {
    res.push(arr1[i++]);
  }
  while (j < len2) {
    res.push(arr2[j++]);
  }
  return res;
};

export const getTopSellHelper = async (req: Request) => {
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
    limitItems: totalRecord,
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
  };
};

// [GET] /products
export const index = async (req: Request, res: Response) => {
  try {
    let find: any = {
      deleted: false,
    };

    const keyword = req.query.keyword;

    find = {
      ...find,
      $or: [
        { title: { $regex: keyword, $options: "si" } },
        { slug: { $regex: keyword, $options: "si" } },
        { shortDescription: { $regex: keyword, $options: "si" } },
        { SKU: { $regex: keyword, $options: "si" } },
      ],
    };

    const totalRecord = await Product.countDocuments(find);

    const initObjectPagination = {
      page: 1,
      limitItems: totalRecord,
    };

    if (req.query.limit) {
      initObjectPagination.limitItems = Number(req.query.limit);
    }

    const objectPagination = Pagination(
      initObjectPagination,
      req.query,
      totalRecord
    );

    const products = await Product.find(find)
      .skip(objectPagination.skip)
      .limit(objectPagination.limitItems)
      .lean();

    for (const pro of products) {
      const subProducts = await SubProduct.find({
        product_id: pro._id,
        deleted: false,
      });

      if (subProducts.length > 0) {
        solvePriceStock(pro, subProducts);
      }
    }

    res.json({
      code: 200,
      message: "OK",
      data: {
        products: products,
        totalRecord: totalRecord,
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

// [GET] /products/detail/:id
export const detail = async (req: Request, res: Response) => {
  try {
    const product_id = req.params.id;

    if (!product_id) {
      throw Error("Missing product_id!!");
    }

    const product = await Product.findOne({ _id: product_id });

    if (!product) {
      throw Error("Product not found!");
    }

    let subProductData = [];

    const variations: {
      _id: string;
      options: any[];
      title: string;
    }[] = [];

    if (product.productType === "variations") {
      const subProducts = await SubProduct.find({
        deleted: false,
        product_id: product.id,
      }).lean();

      if (subProducts.length > 0) {
        const subMap = new Map();

        for (const item of subProducts) {
          subMap.set(String(item._id), { ...item });
        }

        for (const item of subProducts) {
          const subProductOptions = await SubProductOption.find({
            deleted: false,
            sub_product_id: item._id,
          }).lean();

          const options = [];
          if (subProductOptions.length === 0) {
            //it nhat 1 (xoa variation or option)

            subMap.set(String(item._id), null);
          } else {
            for (const subOption of subProductOptions) {
              const option = await VariationOption.findOne({
                _id: subOption.variation_option_id,
                deleted: false,
              });

              if (option) {
                options.push({
                  label: option.title,
                  value: option.id,
                  sub_product_id: item._id,
                });

                const variation = await Variation.findOne({
                  _id: option.variation_id,
                  deleted: false,
                });

                const index = variations.findIndex(
                  (item) => item._id === option.variation_id
                );

                if (index !== -1) {
                  if (
                    !variations[index].options.find(
                      (it) => it.value === option.id
                    )
                  ) {
                    variations[index].options.push({
                      value: option.id,
                      label: option.title,
                    });
                  }
                } else {
                  variations.push({
                    _id: variation.id,
                    options: [
                      {
                        value: option.id,
                        label: option.title,
                      },
                    ],
                    title: variation.title,
                  });
                }
              }
            }
          }
          item["options"] = options;
          if (options.length > 0) {
            subMap.set(String(item._id), {
              ...item,
            });
          }
        }
        subMap.forEach(async (val, key) => {
          if (val) {
            subProductData.push(val);
          } else {
            await SubProduct.updateOne(
              { _id: key },
              { deleted: true, deletedAt: new Date() }
            );
          }
        });
        // subProductData = [...subProducts];
      }
    }

    res.json({
      code: 200,
      message: "OK",
      data: product,
      dataSubProducts: subProductData,
      dataVariationOptions: variations,
    });
  } catch (error) {
    console.log(error);
    res.json({
      code: 400,
      message: error.message || error,
    });
  }
};

// [POST] /products/create
export const create = async (req: Request, res: Response) => {
  try {
    const { data, subProducts } = req.body;

    const price = data?.price || 0;
    const stock = data?.stock || 0;

    const product = new Product({
      price: price,
      stock: stock,
      ...data,
    });

    if (subProducts && subProducts.length > 0) {
      for (const item of subProducts) {
        const subProduct = new SubProduct({
          product_id: product.id,
          price: item?.price || 0,
          stock: item?.stock || 0,
          ...item,
        });
        for (const it of item.options) {
          const subProductOption = new SubProductOption({
            sub_product_id: subProduct.id,
            variation_option_id: it,
          });
          await subProductOption.save();
        }
        await subProduct.save();
      }
    }
    await product.save();

    res.json({
      code: 200,
      message: "Create new success!!",
      data: product,
    });
  } catch (error) {
    console.log(error);
    res.json({
      code: 400,
      message: error.message || error,
    });
  }
};

// [PATCH] /products/edit/:id
export const edit = async (req: Request, res: Response) => {
  try {
    const product_id = req.params.id;

    const product = await Product.findOne({ _id: product_id, deleted: false });

    if (!product) {
      throw Error("Product not found!");
    }

    const productType = req.body.productType;

    switch (productType) {
      case ProductType.SIMPLE:
        //do something...
        break;
      case ProductType.VARIATION:
        //something...
        req.body.price = 0;
        break;
      default:
        throw Error("Type of product is not correct!");
    }

    req.body.price = req.body?.price || 0;

    await Product.updateOne({ _id: product_id }, req.body);

    res.json({
      code: 200,
      message: "Successfully!",
      data: {
        product_id: product_id,
      },
    });
  } catch (error) {
    res.json({
      code: 400,
      message: error.message || error,
    });
  }
};

// [PATCH] /products/edit-sub-product/:id
export const editSubProduct = async (req: Request, res: Response) => {
  try {
    const product_id = req.params.id;
    const subProducts = req.body.subProducts;
    const combinations = req.body.combinations;

    /*
    [
      {
        value: string,
        sub_product_id: string,    
      }
    ]
    */

    const product = await Product.findOne({ _id: product_id, deleted: false });

    if (!product) {
      throw Error("product is not found");
    }

    if (product.productType !== ProductType.VARIATION) {
      product.productType = ProductType.VARIATION;
      await product.save();
    }

    for (const item of subProducts) {
      if (item.sub_product_id) {
        await SubProduct.updateOne(
          { _id: item.sub_product_id },
          {
            price: item?.price || 0,
            stock: item?.stock || 0,
            thumbnail: item?.thumbnail || "",
            discountedPrice: item?.discountedPrice || null,
            SKU: item?.SKU || "",
          }
        );
      }
    }

    const dataSubProducts = await SubProduct.find({
      product_id: product_id,
      deleted: false,
    });

    const keys_combination: any[] = combinations.map((item: any) =>
      item
        .map((it: any) => it.value)
        .sort((a: any, b: any) => (a < b ? 1 : -1))
        .join("-")
    );

    for (const item of dataSubProducts) {
      const subOptions = await SubProductOption.find({
        sub_product_id: item.id,
        deleted: false,
      });
      const key = subOptions
        .map((sop) => sop.variation_option_id)
        .sort((a, b) => (a < b ? 1 : -1))
        .join("-");
      if (keys_combination.includes(key)) {
        const index = keys_combination.findIndex((item) => item === key);
        if (index !== -1) {
          keys_combination.splice(index, 1);
        }
      } else {
        const ids = subOptions.map((sop) => sop.id);

        await SubProductOption.deleteMany({ _id: { $in: ids } });

        // for (const sop of subOptions) {
        //   sop.deleted = true;
        //   sop.deletedAt = new Date();
        //   await sop.save();
        // }

        await SubProduct.updateOne(
          { _id: item._id },
          { deleted: true, deletedAt: new Date() }
        );
      }
    }

    for (const item of keys_combination) {
      const newSubProduct = new SubProduct({ product_id: product_id });
      const options = item.split("-");
      for (const opt of options) {
        const subProductOption = new SubProductOption({
          variation_option_id: opt,
          sub_product_id: newSubProduct.id,
        });
        await subProductOption.save();
      }
      await newSubProduct.save();
    }

    res.json({
      code: 200,
      message: "Successfully!",
    });
  } catch (error) {
    res.json({
      code: 400,
      message: error.message || error,
    });
  }
};

//[GET] /products/get-price
export const getPriceProduct = async (req: Request, res: Response) => {
  const products = await Product.find({ deleted: false });

  let min = 0,
    max = 0;
  const ids = products.map((pro) => pro.id);

  const subProducts = await SubProduct.find({
    product_id: { $in: ids },
    deleted: false,
  });

  max = Math.max(...products.map((pro) => pro.price));
  max = Math.max(...subProducts.map((sub) => sub.price));

  res.json({
    code: 200,
    message: "GET PRICE OK!",
    data: {
      min: min,
      max: max,
    },
  });
};

//[POST] /products/filter-product
export const filterProduct = async (req: Request, res: Response) => {
  try {
    const keyword = req.query.keyword || "";
    const categories = req.body.categories || [];
    const productType = req.body.productType || "";
    const price = req.body.price;

    let find: any = {
      deleted: false,
    };

    if (keyword) {
      find = {
        ...find,
        $or: [
          { title: { $regex: keyword, $options: "si" } },
          { slug: { $regex: keyword, $options: "si" } },
          { shortDescription: { $regex: keyword, $options: "si" } },
          { SKU: { $regex: keyword, $options: "si" } },
        ],
      };
    }

    if (categories.length > 0) {
      find["categories"] = { $all: categories };
    }
    if (productType) {
      find["productType"] = productType;
    }

    let totalRecord = await Product.countDocuments(find);

    const initObjectPagination = {
      page: 1,
      limitItems: totalRecord,
    };

    if (req.query.limit) {
      initObjectPagination.limitItems = Number(req.query.limit);
    }

    const objectPagination = Pagination(
      initObjectPagination,
      req.query,
      totalRecord
    );

    //price
    let data = [];
    if (price) {
      const products = await Product.find(find).lean();

      const skip = objectPagination.skip;
      const limit = objectPagination.limitItems;

      const ids = products.map((item) => item._id);

      const subProducts = await SubProduct.find({
        $and: [
          { deleted: false },
          { product_id: { $in: ids } },
          { price: { $gte: price[0] } },
          { price: { $lte: price[1] } },
        ],
      });

      const subSet = new Set([...subProducts.map((item) => item.product_id)]);

      const allSubs = await SubProduct.find({
        $and: [{ deleted: false }, { product_id: { $in: ids } }],
      }).lean();

      const subMap = new Map();
      for (const item of allSubs) {
        if (!subMap.has(item.product_id)) {
          subMap.set(item.product_id, [{ ...item }]);
        } else {
          const arr = subMap.get(item.product_id);
          arr.push({ ...item });
          subMap.set(item.product_id, [...arr]);
        }
      }

      for (const product of products) {
        if (product.productType === "variations") {
          if (subSet.has(String(product._id))) {
            const allSubs = subMap.get(String(product._id));

            solvePriceStock(product, allSubs);
            data.push(product);
          }
        } else {
          if (product.price >= price[0] && product.price <= price[1]) {
            data.push(product);
          }
        }
      }
      const response = [];
      totalRecord = data.length;

      for (let i = skip; i < Math.min(limit + skip, data.length); i++) {
        response.push(data[i]);
      }

      res.json({
        code: 200,
        message: "OK",
        data: {
          products: response,
          totalRecord: totalRecord,
        },
      });
      return;
    } else {
      const products = await Product.find(find)
        .lean()
        .skip(objectPagination.skip)
        .limit(objectPagination.limitItems);

      for (const product of products) {
        if (product.productType === "variations") {
          const subProducts = await SubProduct.find({
            $and: [{ deleted: false, product_id: product._id }],
          });
          if (subProducts.length > 0) {
            solvePriceStock(product, subProducts);
          }
        }
        data.push(product);
      }
    }

    res.json({
      code: 200,
      message: "OK",
      data: {
        products: data,
        totalRecord: totalRecord,
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

// [DELETE] /products/delete/:id
export const remove = async (req: Request, res: Response) => {
  try {
    const product_id = req.params.id;

    if (!product_id) {
      throw Error("Missing product_id");
    }

    const product = await Product.findOne({ _id: product_id, deleted: false });

    if (!product) {
      throw Error("Product not found!");
    }

    const subProducts = await SubProduct.find({
      product_id: product.id,
      deleted: false,
    });
    if (subProducts.length > 0) {
      const ids = subProducts.map((item) => item.id);
      // await SubProductOption.updateMany(
      //   { sub_product_id: { $in: ids } },
      //   { deleted: true, deletedAt: new Date() }
      // );
      await SubProductOption.deleteMany({ sub_product_id: { $in: ids } });
      await SubProduct.updateMany(
        { product_id: { $in: [product_id] } },
        { deleted: true, deletedAt: new Date() }
      );
    }

    product.deleted = true;
    product.deletedAt = new Date();

    await product.save();

    res.json({
      code: 200,
      message: "Deleted!",
      data: [],
    });
  } catch (error) {
    res.json({
      code: 400,
      message: error.message || error,
    });
  }
};

// [DELETE] /products/sub-product/:id
export const removeSubProduct = async (req: Request, res: Response) => {
  try {
    const sub_product_id = req.params.id;

    if (!sub_product_id) {
      throw Error("Missing sub_product_id!!");
    }

    const subProduct = await SubProduct.findOne({ _id: sub_product_id });

    if (!subProduct) {
      throw Error("Not found!!");
    }

    // await SubProductOption.deleteMany(
    //   { sub_product_id: { $in: [subProduct.id] } },
    //   { deleted: true, deletedAt: new Date() }
    // );

    await SubProductOption.deleteMany({
      sub_product_id: { $in: [subProduct.id] },
    });

    subProduct.deleted = true;
    subProduct.deletedAt = new Date();
    await subProduct.save();

    res.json({
      code: 200,
      message: "Deleted",
    });
  } catch (error) {
    res.json({
      code: 400,
      message: error.message || error,
    });
  }
};

// [PATCH] /products/change-multi
export const changeMulti = async (req: Request, res: Response) => {
  try {
    const action = req.body.action;
    const payload = req.body.payload;

    switch (action) {
      case "delete-all":
        const subProducts = await SubProduct.find({
          product_id: { $in: payload },
          deleted: false,
        });
        const ids = subProducts.map((sub) => sub.id);
        await SubProductOption.deleteMany({ sub_product_id: { $in: ids } });
        await SubProduct.updateMany(
          { _id: { $in: ids } },
          { deleted: true, deletedAt: new Date() }
        );
        await Product.updateMany(
          { _id: { $in: payload } },
          { deleted: true, deletedAt: new Date() }
        );
        break;

      default:
        throw Error("Action not correct!");
    }

    res.json({
      code: 200,
      message: "Successfully!",
    });
  } catch (error) {
    res.json({
      code: 400,
      message: error.message || error,
    });
  }
};

// [GET] /products/get-sku
export const getAllSKU = async (req: Request, res: Response) => {
  try {
    const products = await Product.find({ deleted: false }).select(
      "SKU _id title"
    );

    res.json({
      code: 200,
      message: "OK!",
      data: products,
    });
  } catch (error) {
    res.json({
      code: 400,
      message: error.message || error,
    });
  }
};

// [POST] /products/products-sku
export const productsSKU = async (req: Request, res: Response) => {
  try {
    const ids = req.body.ids;

    const products = await Product.find({
      _id: { $in: ids },
      deleted: false,
    }).lean();

    const subProducts = await SubProduct.find({
      product_id: { $in: ids },
      deleted: false,
    }).lean();

    const subIds = subProducts.map((item) => String(item._id));
    const subOptions = await SubProductOption.find({
      sub_product_id: { $in: subIds },
      deleted: false,
    }).lean();

    const optionsIds = subOptions.map((item) => item.variation_option_id);
    const options = await VariationOption.find({ _id: { $in: optionsIds } });

    const subOptMap = new Map();

    for (const subOption of subOptions) {
      if (subOptMap.has(subOption.sub_product_id)) {
        const value = subOptMap.get(subOption.sub_product_id);
        value.push(subOption.variation_option_id);
        subOptMap.set(subOption.sub_product_id, value);
      } else
        subOptMap.set(subOption.sub_product_id, [
          subOption.variation_option_id,
        ]);
    }

    for (const sub of subProducts) {
      const opts = subOptMap.get(String(sub._id));
      const options_info = opts.map((item: string) => {
        const it = options.find((o) => o.id === item);
        return it.title;
      });
      sub["options"] = options_info;
    }

    for (const item of products) {
      if (item.productType === "variations") {
        const subs = subProducts.filter(
          (it) => it.product_id === String(item._id)
        );
        item["subProducts"] = subs;
      }
    }

    res.json({
      code: 200,
      message: "OK!",
      data: products,
    });
  } catch (error) {
    res.json({
      code: 400,
      message: error.message || error,
    });
  }
};

// [GET] /products/top-sell
export const topSell = async (req: Request, res: Response) => {
  try {
    const { products, products_info } = await getTopSellHelper(req);

    res.json({
      code: 200,
      message: "OK",
      data: {
        products,
        products_info,
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

// [GET] /products/low-quantity
export const lowQuantity = async (req: Request, res: Response) => {
  try {
    let find = {
      deleted: false,
    };

    const products = await Product.find(find);
    const subProducts = await SubProduct.find(find)
      .sort({ stock: "asc" })
      .lean();

    await solveOptionSubProduct(subProducts);

    let simpleProduct = products.filter(
      (item) => item.productType === "simple"
    );
    simpleProduct = simpleProduct.sort((a, b) => a.stock - b.stock);

    let response = merge(simpleProduct, subProducts);

    const totalRecord = response.length;
    const initObjectPagination = {
      page: 1,
      limitItems: totalRecord,
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

    const data = [];

    for (
      let i = skip;
      i < Math.min(totalRecord, skip + objPagination.limitItems);
      i++
    ) {
      const item = response[i];
      if (item.product_id) {
        const product = products.find((it) => it.id === item.product_id);
        if (product) {
          item.thumbnailProduct = product.thumbnail;
          item.title = product.title;
          item.productType = ProductType.VARIATION;
        }
      }
      data.push(item);
    }

    res.json({
      code: 200,
      message: "OK",
      data: data,
    });
  } catch (error) {
    console.log(error);
    res.json({
      code: 400,
      message: error.message || error,
    });
  }
};
