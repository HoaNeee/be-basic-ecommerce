import { Model } from "mongoose";
import { Request, Response } from "express";
import Pagination from "../../../helpers/pagination";
import SubProduct from "../../models/subProduct.model";
import SubProductOption from "../../models/subProductOption.model";
import Product from "../../models/product.model";
import Variation from "../../models/variation.model";
import VariationOption from "../../models/variationOption.model";
import {
  getTopSellHelper,
  solveOptionSubProduct,
  solvePriceStock,
} from "../../../utils/product";
import { MyRequest } from "../../middlewares/admin/auth.middleware";
import PurchaseOrder from "../../models/purchaseOrder.model";
import Supplier from "../../models/supplier.model";
import { embedingProduct } from "../admin/AIAssistant.controller";
import { getQdrantClient } from "../../../configs/database";
import EmbedProduct from "../../models/embedProduct.model";
import { NAMESPACE_UUID } from "../../../helpers/constant";
import { v5 as uuidv5 } from "uuid";
import SyncEmbedTime from "../../models/syncEmbedTime";

enum ProductType {
  SIMPLE = "simple",
  VARIATION = "variations",
}

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

// [GET] /products
export const products = async (req: Request, res: Response) => {
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
      .sort({ createdAt: -1 })
      .lean();

    const product_ids = products.map((item) => String(item._id));
    const subProducts = await SubProduct.find({
      product_id: { $in: product_ids },
      deleted: false,
    });

    for (const pro of products) {
      const subs = subProducts.filter(
        (item) => String(item.product_id) === String(pro._id)
      );

      if (subs.length > 0) {
        solvePriceStock(pro, subs);
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
export const detail_v2 = async (req: Request, res: Response) => {
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

        const sub_product_ids = subProducts.map((item) => String(item._id));
        const sub_options = await SubProductOption.find({
          deleted: false,
          sub_product_id: { $in: sub_product_ids },
        }).lean();

        const option_ids = sub_options.map((item) =>
          String(item.variation_option_id)
        );

        const variation_option_ids = await VariationOption.find({
          _id: { $in: option_ids },
          deleted: false,
        });

        const variation_ids = variation_option_ids.map((item) =>
          String(item.variation_id)
        );

        const variationsData = await Variation.find({
          _id: { $in: variation_ids },
          deleted: false,
        });

        for (const item of subProducts) {
          const subProductOptions = sub_options.filter(
            (opt) => String(opt.sub_product_id) === String(item._id)
          );

          const options = [];
          if (subProductOptions.length === 0) {
            //it nhat 1 (xoa variation or option)

            subMap.set(String(item._id), null);
          } else {
            for (const subOption of subProductOptions) {
              const option = variation_option_ids.find(
                (opt) =>
                  String(opt._id) === String(subOption.variation_option_id)
              );

              if (option) {
                options.push({
                  label: option.title,
                  value: option.id,
                  sub_product_id: item._id,
                });

                const variation = variationsData.find(
                  (item) => item.id === option.variation_id
                );

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

    const price = data?.price;
    const stock = data?.stock || 0;

    const product = new Product({
      price: price,
      stock: stock,
      ...data,
    });

    const skus = [data?.SKU || ""];

    let message = "Create new success";
    const prefix_SKU = `KAKRIST-SKU`;

    const subs = [];
    const subOptions = [];
    const pos = [];
    let exist_pos = false;
    if (subProducts && subProducts.length > 0) {
      for (const item of subProducts) {
        const subProduct = new SubProduct({
          product_id: product.id,
          price: Number(item?.price || 0),
          stock: Number(item?.stock || 0),
          cost: Number(item?.cost || 0),
          ...item,
        });

        // Check if create purchase order
        const createPurchaseOrder = item?.createPurchaseOrder || false;
        if (createPurchaseOrder) {
          if (exist_pos) {
            const po = pos[0];
            const products = po.products;
            products.push({
              ref_id: subProduct.id,
              SKU: subProduct.SKU || "",
              quantity: subProduct.stock,
              unitCost: subProduct.cost,
            });
            po.products = products;
            po.totalCost = products.reduce(
              (acc: number, curr: any) => acc + curr.unitCost * curr.quantity,
              0
            );
          } else {
            const po = new PurchaseOrder({
              products: [
                {
                  ref_id: subProduct.id,
                  SKU: subProduct.SKU || "",
                  quantity: subProduct.stock,
                  unitCost: subProduct.cost,
                },
              ],
              supplier_id: data?.supplier_id || "",
              expectedDelivery: new Date(
                new Date().getTime() + 5 * 24 * 60 * 60 * 1000
              ),
              totalCost: subProduct.stock * subProduct.cost,
              typePurchase: "initial",
            });
            pos.push(po);
          }
          exist_pos = true;
        }

        skus.push(item?.SKU || "");

        subs.push(subProduct);

        for (const it of item.options) {
          const subProductOption = new SubProductOption({
            sub_product_id: subProduct.id,
            variation_option_id: it,
          });
          subOptions.push(subProductOption);
        }
      }

      const existSkus = await SubProduct.find({
        SKU: { $in: skus },
        deleted: false,
      });

      for (const subProduct of subs) {
        const exist = existSkus.find((it) => it.SKU === subProduct.SKU);
        if (exist || !subProduct.SKU) {
          message = "Create new success, but some SKU already exist!!";
          subProduct.SKU = `${prefix_SKU}-${(
            Date.now() +
            Math.random() * 1000
          ).toFixed(0)}`;
        }
      }
    }

    const existSkus = await Product.find({
      SKU: { $in: skus },
      deleted: false,
    });

    if (existSkus.length > 0 || !data?.SKU) {
      product.SKU = `${prefix_SKU}-${(
        Date.now() +
        Math.random() * 1000
      ).toFixed(0)}`;
      message = "Create new success, but some SKU already exist!!";
    }

    await Promise.all([
      product.save(),
      SubProduct.insertMany(subs),
      SubProductOption.insertMany(subOptions),
      PurchaseOrder.insertMany(pos),
    ]);

    const isEmbedding = data?.isEmbedding || false;

    if (isEmbedding) {
      await embedingProduct(product, subs, subOptions);
    } else {
      syncEmbedProductData({
        id: String(product._id),
        action: "update",
        type: "one",
      });
    }

    const createPurchaseOrder = data?.createPurchaseOrder || false;

    if (product.productType === ProductType.SIMPLE) {
      if (createPurchaseOrder) {
        const po = new PurchaseOrder({
          products: [
            {
              ref_id: product.id,
              SKU: product.SKU || "",
              quantity: product.stock,
              unitCost: product.cost || 0,
            },
          ],
          supplier_id: data?.supplier_id || "",
          expectedDelivery: new Date(
            new Date().getTime() + 5 * 24 * 60 * 60 * 1000
          ),
          totalCost: Number(product.stock * (product.cost || 0)),
          typePurchase: "initial",
        });
        await po.save();
      }
    }

    res.json({
      code: 200,
      message: message,
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
        req.body.price = req.body.price || 0;
        break;
      case ProductType.VARIATION:
        req.body.price = null;
        break;
      default:
        throw Error("Type of product is not correct!");
    }

    req.body.stock = req.body?.stock || 0;

    await syncEmbedProductData({
      id: String(product._id),
      action: "update",
      type: "one",
    });

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
export const editSubProduct_v2 = async (req: MyRequest, res: Response) => {
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

    if (!product_id) {
      res.status(400).json({
        code: 400,
        message: "Product ID is required",
      });
      return;
    }

    const prefix_SKU = `KAKRIST-SKU`;

    const [product] = await Promise.all([
      Product.findOne({ _id: product_id, deleted: false }),
      syncEmbedProductData({
        id: product_id,
        action: "update",
        type: "one",
      }),
    ]);

    if (!product) {
      throw Error("product is not found");
    }

    if (product.productType !== ProductType.VARIATION) {
      product.productType = ProductType.VARIATION;
      await product.save();
    }

    const update_sub_exist = [];

    for (const item of subProducts) {
      if (item.sub_product_id) {
        update_sub_exist.push(
          SubProduct.updateOne(
            { _id: item.sub_product_id },
            {
              price: item?.price,
              stock: item?.stock || 0,
              thumbnail: item?.thumbnail || "",
              discountedPrice: item?.discountedPrice || null,
              SKU:
                item?.SKU ||
                `${prefix_SKU}-${(Date.now() + Math.random() * 1000).toFixed(
                  0
                )}`,
            }
          )
        );
      }
    }

    await Promise.all(update_sub_exist);

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

    const subProductOptions = await SubProductOption.find({
      sub_product_id: { $in: dataSubProducts.map((item) => item.id) },
      deleted: false,
    });

    const sub_product_need_delete = [];

    for (const item of dataSubProducts) {
      const subOptions = subProductOptions.filter(
        (opt) => String(opt.sub_product_id) === String(item._id)
      );
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
        sub_product_need_delete.push(item.id);
      }
    }

    if (sub_product_need_delete.length > 0) {
      await SubProduct.updateMany(
        { _id: { $in: sub_product_need_delete } },
        { deleted: true, deletedAt: new Date() }
      );
    }

    const new_sub_products = [];
    const new_sub_product_options = [];

    for (const item of keys_combination) {
      const newSubProduct = new SubProduct({
        product_id: product_id,
        SKU: `${prefix_SKU}-${(Date.now() + Math.random() * 1000).toFixed(0)}`,
      });
      const options = item.split("-");
      for (const opt of options) {
        const subProductOption = new SubProductOption({
          variation_option_id: opt,
          sub_product_id: newSubProduct.id,
        });
        new_sub_product_options.push(subProductOption);
      }
      new_sub_products.push(newSubProduct);
    }

    if (new_sub_products.length > 0) {
      await SubProduct.insertMany(new_sub_products);
      await SubProductOption.insertMany(new_sub_product_options);
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

      const [subProducts, allSubs] = await Promise.all([
        SubProduct.find({
          $and: [
            { deleted: false },
            { product_id: { $in: ids } },
            { price: { $gte: price[0] } },
            { price: { $lte: price[1] } },
          ],
        }),
        SubProduct.find({
          $and: [{ deleted: false }, { product_id: { $in: ids } }],
        }).lean(),
      ]);

      const subSet = new Set([...subProducts.map((item) => item.product_id)]);

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

      const subProducts = await SubProduct.find({
        $and: [
          { deleted: false },
          { product_id: { $in: products.map((item) => item._id) } },
        ],
      });

      for (const product of products) {
        if (product.productType === "variations") {
          const subs = subProducts.filter(
            (item) => String(item.product_id) === String(product._id)
          );
          if (subs.length > 0) {
            solvePriceStock(product, subs);
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
      await SubProductOption.updateMany(
        { sub_product_id: { $in: ids } },
        { deleted: true, deletedAt: new Date() }
      );
      await SubProduct.updateMany(
        { product_id: { $in: [product_id] } },
        { deleted: true, deletedAt: new Date() }
      );
    }

    product.deleted = true;
    product.deletedAt = new Date();

    await Promise.all([
      product.save(),
      syncEmbedProductData({
        id: String(product._id),
        action: "delete",
        type: "one",
      }),
    ]);

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

    await SubProductOption.updateMany(
      {
        sub_product_id: { $in: [subProduct.id] },
      },
      {
        deleted: true,
        deletedAt: new Date(),
      }
    );

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

        await SubProductOption.updateMany(
          { sub_product_id: { $in: ids } },
          { deleted: true, deletedAt: new Date() }
        );
        await SubProduct.updateMany(
          { _id: { $in: ids } },
          { deleted: true, deletedAt: new Date() }
        );
        await syncEmbedProductData({
          ids: payload,
          action: "delete",
          type: "many",
        });
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

//[GET] /products/trash
export const trashProducts = async (req: Request, res: Response) => {
  try {
    let find: any = {
      deleted: true,
    };

    const keyword = req.query.keyword || "";

    if (keyword) {
      find.$or = [
        { title: { $regex: keyword, $options: "si" } },
        { SKU: { $regex: keyword, $options: "si" } },
      ];
    }

    const initPagination = {
      page: 1,
      limitItems: 10,
    };

    if (req.query.limit) {
      initPagination.limitItems = Number(req.query.limit);
    }

    const totalRecord = await Product.countDocuments(find);

    const pagination = Pagination(initPagination, req.query, totalRecord);

    const products = await Product.aggregate([
      { $match: find },
      {
        $addFields: {
          product_id_string: { $toString: "$_id" },
          categories_object_ids: {
            $map: {
              input: "$categories",
              as: "category",
              in: { $toObjectId: "$$category" },
            },
          },
        },
      },
      {
        $lookup: {
          from: "sub-products",
          localField: "product_id_string",
          foreignField: "product_id",
          as: "subProducts",
        },
      },

      {
        $lookup: {
          from: "categories",
          localField: "categories_object_ids",
          foreignField: "_id",
          as: "categories_info",
          pipeline: [{ $project: { title: 1 } }],
        },
      },
      {
        $set: {
          count_sub_product: { $size: "$subProducts" },
        },
      },
      { $unset: ["subProducts"] },
      { $skip: pagination.skip },
      { $limit: pagination.limitItems },
    ]);

    const supplier_ids = products
      .filter((it) => it.supplier_id)
      .map((item) => item.supplier_id);

    const suppliers = await Supplier.find({ _id: { $in: supplier_ids } });

    for (const product of products) {
      const supplier = suppliers.find((it) => it._id === product.supplier_id);
      if (supplier) {
        product.supplierName = supplier.name;
      } else {
        product.supplierName = "Unknown";
      }
    }

    res.json({
      code: 200,
      message: "OK",
      data: {
        products,
        totalRecord,
      },
    });
  } catch (error) {
    res.json({
      code: 400,
      message: error.message || error,
    });
  }
};

//[GET] /products/sub-product-trash
export const trashSubProducts = async (req: Request, res: Response) => {
  try {
    let find: any = {
      deleted: true,
    };

    const keyword = req.query.keyword || "";

    if (keyword) {
      find.$or = [
        { title: { $regex: keyword, $options: "si" } },
        { SKU: { $regex: keyword, $options: "si" } },
      ];

      const product = await Product.find(find);

      if (product && product.length > 0) {
        find.product_id = { $in: product.map((item) => item._id) };
      } else {
        find.product_id = { $in: [] };
      }
    }

    const initPagination = {
      page: 1,
      limitItems: 10,
    };

    if (req.query.limit) {
      initPagination.limitItems = Number(req.query.limit);
    }

    const totalRecord = await SubProduct.countDocuments(find);

    const pagination = Pagination(initPagination, req.query, totalRecord);

    const subProducts = await SubProduct.find(find)
      .sort({ createdAt: "desc" })
      .skip((pagination.page - 1) * pagination.limitItems)
      .limit(pagination.limitItems)
      .lean();

    const product_ids = subProducts.map((item) => item.product_id);
    const sub_ids = subProducts.map((item) => String(item._id));

    const [subOptions, products] = await Promise.all([
      SubProductOption.find({
        sub_product_id: { $in: sub_ids },
      }),
      Product.find({
        _id: { $in: product_ids },
      }),
    ]);

    const options = await VariationOption.find({
      _id: { $in: subOptions.map((item) => item.variation_option_id) },
    });

    for (const sub of subProducts) {
      const product = products.find((it) => it.id === sub.product_id);
      if (product) {
        sub["thumbnail_product"] = product.thumbnail;
        sub["title"] = product.title;
      }

      const subOpts = subOptions.filter(
        (item) => item.sub_product_id === String(sub._id)
      );
      if (subOpts && subOpts.length) {
        const opts = options.filter((item) =>
          subOpts
            .map((subOpt) => subOpt.variation_option_id)
            .includes(String(item._id))
        );
        if (opts && opts.length) {
          sub["options"] = opts;
        }
      }
    }

    res.json({
      code: 200,
      message: "OK",
      data: {
        subProducts,
        totalRecord,
      },
    });
  } catch (error) {
    res.json({
      code: 400,
      message: error.message || error,
    });
  }
};

//[PATCH] /products/change-trash/:productId
export const changeTrashOne = async (req: Request, res: Response) => {
  try {
    const product_id = req.params.productId;
    const type = req.query.type as string;
    const checkedSubProduct = req.body.checkedSubProduct;

    return await changeTrashOneHelper(
      product_id,
      type,
      checkedSubProduct,
      req,
      res,
      Product,
      true
    );
  } catch (error) {
    res.json({
      code: 400,
      message: error.message || error,
    });
  }
};

//[PATCH] /products/change-sub-product-trash/:subId
export const changeSubproductTrashOne = async (req: Request, res: Response) => {
  try {
    const sub_id = req.params.subId;
    const type = req.query.type as string;

    return await changeTrashOneHelper(
      sub_id,
      type,
      false,
      req,
      res,
      SubProduct,
      false
    );
  } catch (error) {
    res.status(400).json({
      code: 400,
      message: error.message || error,
    });
  }
};

//[PATCH] /products/bulk-trash
export const bulkChangeTrash = async (req: Request, res: Response) => {
  try {
    const action = req.query.action as string;
    const ids = req.body.ids;
    const checkedSubProduct = req.body.checkedSubProduct;

    return await bulkChangeHelper(
      ids,
      action,
      checkedSubProduct,
      req,
      res,
      Product,
      "product"
    );
  } catch (error) {
    res.json({
      code: 400,
      message: error.message || error,
    });
  }
};

//[PATCH] /products/bulk-sub-trash
export const bulkChangeSubProductTrash = async (
  req: Request,
  res: Response
) => {
  try {
    const action = req.query.action as string;
    const ids = req.body.ids;

    return await bulkChangeHelper(
      ids,
      action,
      false,
      req,
      res,
      SubProduct,
      "subProduct"
    );
  } catch (error) {
    res.json({
      code: 400,
      message: error.message || error,
    });
  }
};

//[PATCH] /products/change-trash-all
export const changeTrashAll = async (req: Request, res: Response) => {
  try {
    const action = req.query.action as string;
    const checkedSubProduct = req.body.checkedSubProduct as boolean;

    const products = await Product.find({
      deleted: true,
    });

    await syncEmbedProductData({
      ids: products.map((item) => String(item._id)),
      action: action === "restore" ? "update" : "delete",
      type: "many",
    });

    return await changeTrashAllHelper(
      action,
      checkedSubProduct,
      req,
      res,
      Product,
      "product"
    );
  } catch (error) {
    res.json({
      code: 400,
      message: error.message || error,
    });
  }
};

//[PATCH] /products/change-sub-trash-all
export const changeSubProductTrashAll = async (req: Request, res: Response) => {
  try {
    const action = req.query.action as string;

    return await changeTrashAllHelper(
      action,
      false,
      req,
      res,
      SubProduct,
      "subProduct"
    );
  } catch (error) {
    res.json({
      code: 400,
      message: error.message || error,
    });
  }
};

//[POST] /products/embed/:productId
export const embedProduct = async (req: MyRequest, res: Response) => {
  try {
    const product_id = req.params.productId;
    const type = req.query.type as string;

    if (type === "delete") {
      await deleteEmbedHelper(product_id);
      res.status(200).json({
        code: 200,
        message: "Delete product successfully",
      });
      await EmbedProduct.deleteOne({ product_id });
      return;
    }

    await embedProductHelper(res, product_id);
    await EmbedProduct.deleteOne({ product_id });

    res.status(200).json({
      code: 200,
      message: "Embed product successfully",
    });
  } catch (error) {
    res.status(500).json({
      code: 500,
      message: error.message || error,
    });
  }
};

//[GET] /products/embed
export const getEmbedProduct = async (req: MyRequest, res: Response) => {
  try {
    const qdrantClient = getQdrantClient();

    let limit = 10;
    let next_page_offset = "";
    if (req.query.limit) {
      limit = parseInt(req.query.limit as string) || 10;
    }
    if (req.query.next_page_offset) {
      next_page_offset = req.query.next_page_offset as string;
    }

    const collection = await qdrantClient.scroll("products", {
      limit: limit,
      offset: next_page_offset || 0,
      with_payload: true,
    });

    res.status(200).json({
      code: 200,
      message: "successfully!",
      data: {
        products: collection.points.map((item) => {
          return {
            vector_id: item.id,
            vector: item.vector,
            ...item.payload,
          };
        }),
        next_page_offset: collection.next_page_offset,
      },
    });
  } catch (error) {
    res.status(500).json({
      code: 500,
      message: error.message || error,
    });
  }
};

//[PATCH] /products/embed/sync/:vector_id
export const syncEmbedProduct = async (req: MyRequest, res: Response) => {
  try {
    const vector_id = req.params.vector_id;
    const collection_name = req.query.collection_name as string;

    if (!vector_id) {
      res.status(400).json({
        code: 400,
        message: "Vector ID is required",
      });
      return;
    }

    const qdrantClient = getQdrantClient();

    const records = await qdrantClient.retrieve(collection_name, {
      ids: [vector_id],
    });

    let record = records[0].payload;
    const product_id =
      collection_name === "products" ? record._id : record.product_id;

    const [product, subProducts] = await Promise.all([
      Product.findOne({
        _id: product_id,
        deleted: false,
      }).lean(),
      SubProduct.find({
        product_id: product_id,
        deleted: false,
      }).lean(),
    ]);

    const subOptions = await SubProductOption.find({
      sub_product_id: { $in: subProducts.map((item) => String(item._id)) },
      deleted: false,
    }).lean();

    if (product && subProducts.length > 0 && subOptions.length > 0) {
      await embedingProduct(product, subProducts, subOptions);
    }

    const newRecord = await qdrantClient.retrieve(collection_name, {
      ids: [vector_id],
    });

    record = newRecord[0].payload;

    res.status(200).json({
      code: 200,
      message: "Sync Successfully!",
      data: record,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      code: 500,
      message: error.message || error,
    });
  }
};

//[GET] /products/embed/sub-products
export const getEmbedSubProduct = async (req: MyRequest, res: Response) => {
  try {
    const qdrantClient = getQdrantClient();

    let limit = 10;
    let next_page_offset = "";
    if (req.query.limit) {
      limit = parseInt(req.query.limit as string) || 10;
    }
    if (req.query.next_page_offset) {
      next_page_offset = req.query.next_page_offset as string;
    }

    const collection = await qdrantClient.scroll("sub-products", {
      limit: limit,
      offset: next_page_offset || 0,
      with_payload: true,
      with_vector: false,
    });

    res.status(200).json({
      code: 200,
      message: "successfully!",
      data: {
        subProducts: collection.points.map((item) => {
          return {
            vector_id: item.id,
            ...item.payload,
          };
        }),
        next_page_offset: collection.next_page_offset,
      },
    });
  } catch (error) {
    res.status(500).json({
      code: 500,
      message: error.message || error,
    });
  }
};

//[GET] /products/embed/statistics
export const getEmbedStatistic = async (req: MyRequest, res: Response) => {
  try {
    const qdrantClient = getQdrantClient();

    const sub_collection = await qdrantClient.getCollection("sub-products");
    const total_vectors_sub_products = sub_collection.points_count;
    const subProduct = await qdrantClient.scroll("sub-products", {
      limit: 1,
      with_payload: true,
      with_vector: false,
    });

    let payload: any = {};

    if (subProduct.points.length > 0) {
      payload = subProduct.points[0].payload;
    }

    const object = await getProductNotEmbedHelper();
    const sync_time = await SyncEmbedTime.findOne({ type_sync: "product" });

    res.status(200).json({
      code: 200,
      message: "successfully!",
      data: {
        total_vectors: object.total_vectors,
        total_vectors_sub_products,
        pending_embeddings: object.product_not_embedded.length,
        pending_sync: object.product_need_sync.length,
        last_sync: sync_time ? sync_time.sync_time : null,
        payload_schema_product: object.payload_schema_product,
        payload_schema_sub_product: {
          ...payload,
          payload_schema: sub_collection.payload_schema,
        },
      },
    });
  } catch (error) {
    res.status(500).json({
      code: 500,
      message: error.message || error,
    });
  }
};

//[GET] /products/embed/not-embedded
export const getProductNotEmbeded = async (req: MyRequest, res: Response) => {
  try {
    const object = await getProductNotEmbedHelper();

    res.status(200).json({
      code: 200,
      message: "successfully!",
      data: {
        product_not_embedded: object.product_not_embedded,
        product_need_sync: object.product_need_sync,
      },
    });
  } catch (error) {
    res.status(500).json({
      code: 500,
      message: error.message || error,
    });
  }
};

//[DELETE] /products/embed/delete/:vector_id
export const deleteEmbedProduct = async (req: MyRequest, res: Response) => {
  try {
    const vector_id = req.params.vector_id;
    const collection_name = req.query.collection_name as string;

    const qdrantClient = getQdrantClient();

    if (collection_name === "products") {
      const records = await qdrantClient.retrieve("products", {
        ids: [vector_id],
        with_payload: true,
        with_vector: false,
      });
      const product_id = records[0].payload._id;
      await deleteEmbedHelper(product_id as string);
    } else {
      await qdrantClient.delete(collection_name, {
        points: [vector_id],
      });
    }

    res.status(200).json({
      code: 200,
      message: "Deleted Embedding Successfully!",
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      code: 500,
      message: error.message || error,
    });
  }
};

//[POST] /products/embed/sync/sync-time
export const syncEmbedTime = async (req: MyRequest, res: Response) => {
  try {
    const type_sync = req.body.type_sync;

    const record = await SyncEmbedTime.findOne({ type_sync });

    if (!record) {
      await SyncEmbedTime.insertOne({
        type_sync,
        sync_time: new Date(),
      });
    } else {
      record.sync_time = new Date();
      await record.save();
    }

    res.status(200).json({
      code: 200,
      message: "Sync Time Successfully!",
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      code: 500,
      message: error.message || error,
    });
  }
};

//[GET] /products/get-all-product-ids
export const getAllProductID = async (req: MyRequest, res: Response) => {
  try {
    const products = await Product.find(
      { deleted: false },
      { _id: 1, title: 1 }
    ).lean();

    res.status(200).json({
      code: 200,
      message: "Get All Product IDs Successfully!",
      data: products,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      code: 500,
      message: error.message || error,
    });
  }
};

//[PATCH] /products/embed/change/indexed
export const changeIndexed = async (req: MyRequest, res: Response) => {
  try {
    const payload = req.body.payload || [];

    const payload_product = payload.filter(
      (it: any) => it.product_type === "product"
    );

    const payload_sub_product = payload.filter(
      (it: any) => it.product_type === "sub-product"
    );

    const qdrantClient = getQdrantClient();

    const promises = [];

    for (const item of payload_sub_product) {
      const key = item.key;
      if (item.checked) {
        promises.push(
          qdrantClient.createPayloadIndex("sub-products", {
            field_name: key,
            field_schema: item.data_type,
          })
        );
      } else {
        promises.push(qdrantClient.deletePayloadIndex("sub-products", key));
      }
    }

    for (const item of payload_product) {
      const key = item.key;
      if (item.checked) {
        promises.push(
          qdrantClient.createPayloadIndex("products", {
            field_name: key,
            field_schema: item.data_type,
          })
        );
      } else {
        promises.push(qdrantClient.deletePayloadIndex("products", key));
      }
    }

    await Promise.all(promises);

    res.status(200).json({
      code: 200,
      message: "Change Indexed Successfully!",
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      code: 500,
      message: error.message || error,
    });
  }
};

//[DELETE] /products/embed/bulk-delete
export const bulkEmbedProduct = async (req: MyRequest, res: Response) => {
  try {
    const vector_ids = req.body.vector_ids as string[];
    const collection_name = req.query.collection_name as string;

    if (!vector_ids || vector_ids.length === 0) {
      res.status(400).json({
        code: 400,
        message: "Vector IDs are required",
      });
      return;
    }

    const qdrantClient = getQdrantClient();

    if (collection_name === "products") {
      const records = await getQdrantClient().retrieve("products", {
        ids: vector_ids,
        with_payload: true,
        with_vector: false,
      });
      const product_ids = records.map((item) => item.payload._id);
      await Promise.all(
        product_ids.map((id) =>
          qdrantClient.delete("sub-products", {
            filter: {
              must: [
                {
                  key: "product_id",
                  match: { value: id },
                },
              ],
            },
          })
        )
      );
    }

    await qdrantClient.delete(collection_name, {
      points: vector_ids,
    });

    res.status(200).json({
      code: 200,
      message: "Deleted Embedding Successfully!",
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      code: 500,
      message: error.message || error,
    });
  }
};

const embedProductHelper = async (res: Response, product_id: string) => {
  try {
    if (!product_id) {
      res.status(400).json({
        code: 400,
        message: "Product ID is required",
      });
      return;
    }

    const product = await Product.findOne({ _id: product_id, deleted: false });

    if (!product) {
      res.status(404).json({
        code: 404,
        message: "Product not found",
      });
      return;
    }

    const subProducts = await SubProduct.find({
      product_id,
      deleted: false,
    }).lean();
    const sub_ids = subProducts.map((item) => String(item._id));
    const subOptions = await SubProductOption.find({
      sub_product_id: { $in: sub_ids },
      deleted: false,
    }).lean();

    await embedingProduct(product, subProducts, subOptions);
  } catch (error) {
    throw error;
  }
};

const getProductNotEmbedHelper = async () => {
  try {
    const qdrantClient = getQdrantClient();

    const collection = await qdrantClient.getCollection("products");

    const total_vectors = collection.points_count;

    const records = await qdrantClient.scroll("products", {
      limit: total_vectors,
      with_payload: true,
      with_vector: false,
    });

    let payload: any = {};

    if (records.points.length > 0) {
      payload = records.points[0].payload;
    }

    const embedProductData = await EmbedProduct.find({});

    const embedProductIds = embedProductData.map((item) => item.product_id);

    const product_ids = records.points.map((item) => item.payload._id);

    const [product_not_embedded, product_need_sync] = await Promise.all([
      Product.find({
        _id: { $nin: product_ids },
        deleted: false,
      })
        .select("title thumbnail SKU")
        .lean(),
      Product.find({
        _id: { $in: embedProductIds },
      })
        .select("title thumbnail SKU")
        .lean(),
    ]);

    return {
      total_vectors,
      product_not_embedded: product_not_embedded.map((item) => ({
        ...item,
        type: "update",
      })),
      product_need_sync: product_need_sync.map((item) => {
        const it = embedProductData.find(
          (e) => e.product_id === String(item._id)
        );
        return {
          ...item,
          type: it.type,
        };
      }),
      payload_schema_product: {
        ...payload,
        payload_schema: collection.payload_schema,
      },
    };
  } catch (error) {
    throw error;
  }
};

const changeTrashOneHelper = async (
  id: string,
  type: string,
  checkedSubProduct: boolean,
  req: Request,
  res: Response,
  Model: Model<any>,
  isProduct: boolean
) => {
  try {
    if (!id) {
      res.status(400).json({
        code: 400,
        message: "Product ID is required",
      });
      return;
    }

    const record = await Model.findOne({ _id: id, deleted: true });

    if (!record) {
      res.status(404).json({
        code: 404,
        message: "Product not found",
      });
      return;
    }

    if (isProduct) {
      await syncEmbedProductData({
        id,
        action: type === "restore" ? "update" : "delete",
        type: "one",
      });
    }

    if (type === "restore") {
      record.deleted = false;
      delete record.deletedAt;
      if (
        checkedSubProduct &&
        isProduct &&
        record.productType === "variations"
      ) {
        const subProducts = await SubProduct.find({
          product_id: record._id,
          deleted: true,
        });
        await Promise.all([
          SubProductOption.updateMany(
            { sub_product_id: { $in: subProducts.map((item) => item._id) } },
            { deleted: false }
          ),
          SubProduct.updateMany(
            { _id: { $in: subProducts.map((item) => item._id) } },
            { deleted: false }
          ),
        ]);
      }
      await record.save();
    } else if (type === "delete") {
      if (
        checkedSubProduct &&
        isProduct &&
        record.productType === "variations"
      ) {
        const subProducts = await SubProduct.find({ product_id: record._id });
        await Promise.all([
          SubProductOption.deleteMany({
            sub_product_id: { $in: subProducts.map((item) => item._id) },
          }),
          SubProduct.deleteMany({
            _id: { $in: subProducts.map((item) => item._id) },
          }),
        ]);
      }
      await Model.deleteOne({ _id: id });
    }

    res.json({
      code: 200,
      message: `${type === "restore" ? "Restored" : "Deleted"} Successfully`,
    });
  } catch (error) {
    throw error;
  }
};

const bulkChangeHelper = async (
  ids: string[],
  action: string,
  checkedSubProduct: boolean,
  req: Request,
  res: Response,
  Model: Model<any>,
  type: "product" | "subProduct" = "product"
) => {
  try {
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      res.status(400).json({
        code: 400,
        message: "Product IDs are required",
      });
      return;
    }

    const records = await Model.find({ _id: { $in: ids }, deleted: true });

    if (!records || records.length === 0) {
      res.status(404).json({
        code: 404,
        message: "No products found",
      });
      return;
    }

    if (type === "product") {
      syncEmbedProductData({
        ids,
        action: action === "restore" ? "update" : "delete",
        type: "many",
      });
    }

    if (action === "restore") {
      await Model.updateMany({ _id: { $in: ids } }, { deleted: false });
      if (checkedSubProduct && type === "product") {
        const subProducts = await SubProduct.find({
          product_id: { $in: ids },
          deleted: true,
        });

        await Promise.all([
          SubProductOption.updateMany(
            { sub_product_id: { $in: subProducts.map((item) => item._id) } },
            { deleted: false }
          ),
          SubProduct.updateMany(
            { _id: { $in: subProducts.map((item) => item._id) } },
            { deleted: false }
          ),
        ]);
      }
    } else if (action === "delete") {
      await Model.deleteMany({ _id: { $in: ids } });
      if (checkedSubProduct && type === "product") {
        const subProducts = await SubProduct.find({ product_id: { $in: ids } });
        await Promise.all([
          SubProductOption.deleteMany({
            sub_product_id: { $in: subProducts.map((item) => item._id) },
          }),
          SubProduct.deleteMany({
            _id: { $in: subProducts.map((item) => item._id) },
          }),
        ]);
      }
    }

    res.json({
      code: 200,
      message: `${action === "restore" ? "Restored" : "Deleted"} Successfully`,
    });
  } catch (error) {
    console.log(error);
    throw error;
  }
};

const changeTrashAllHelper = async (
  action: string,
  checkedSubProduct: boolean,
  req: Request,
  res: Response,
  Model: Model<any>,
  type: "product" | "subProduct" = "product"
) => {
  try {
    if (action === "restore") {
      await Model.updateMany(
        { deleted: true },
        { deleted: false, deletedAt: null }
      );
      if (checkedSubProduct && type === "product") {
        await Promise.all([
          SubProductOption.updateMany(
            { deleted: true },
            { deleted: false, deletedAt: null }
          ),
          SubProduct.updateMany(
            { deleted: true },
            { deleted: false, deletedAt: null }
          ),
        ]);
      }
    } else if (action === "delete") {
      await Model.deleteMany({ deleted: true });
      if (checkedSubProduct && type === "product") {
        await Promise.all([
          SubProductOption.deleteMany({ deleted: true }),
          SubProduct.deleteMany({ deleted: true }),
        ]);
      }
    }

    res.json({
      code: 200,
      message: `${action === "restore" ? "Restored" : "Deleted"} Successfully`,
    });
  } catch (error) {
    console.log(error);
    throw error;
  }
};

const syncEmbedProductData = async ({
  ids,
  id,
  action,
  type,
}: {
  ids?: string[];
  id?: string;
  action: string;
  type: "one" | "many";
}) => {
  try {
    if (type === "many") {
      const exists = await EmbedProduct.find({
        product_id: { $in: ids },
      });

      const exist_ids = exists.map((item) => String(item.product_id));

      if (exists.length > 0) {
        await EmbedProduct.updateMany(
          {
            _id: { $in: exists.map((item) => item._id) },
          },
          {
            type: action,
          }
        );
      } else {
        const new_ids = ids.filter((id) => !exist_ids.includes(id));
        await EmbedProduct.insertMany(
          new_ids.map((id) => ({
            product_id: id,
            type: action,
          }))
        );
      }
    } else {
      const exist = await EmbedProduct.findOne({ product_id: id });
      if (exist) {
        await EmbedProduct.updateOne({ product_id: id }, { type: action });
      } else {
        await EmbedProduct.insertOne({
          product_id: id,
          type: action,
        });
      }
    }
  } catch (error) {
    throw error;
  }
};

const deleteEmbedHelper = async (product_id: string) => {
  try {
    if (!product_id) {
      throw new Error("Product ID is required");
    }
    const NAMESPACE = NAMESPACE_UUID;
    const product_uuid = uuidv5(product_id, NAMESPACE);
    const subProducts = await SubProduct.find({ product_id });
    const sub_uuids = subProducts.map((item) =>
      uuidv5(String(item._id), NAMESPACE)
    );
    const qdrantClient = getQdrantClient();
    await Promise.all([
      qdrantClient.delete("products", {
        points: [product_uuid],
      }),
      qdrantClient.delete("sub-products", {
        points: sub_uuids,
      }),
    ]);
  } catch (error) {
    throw error;
  }
};
