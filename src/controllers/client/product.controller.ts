import { Request, Response } from "express";
import Pagination from "../../../helpers/pagination";
import SubProduct from "../../models/subProduct.model";
import SubProductOption from "../../models/subProductOption.model";
import Product from "../../models/product.model";
import Variation from "../../models/variation.model";
import VariationOption from "../../models/variationOption.model";
import Supplier from "../../models/supplier.model";
import Review from "../../models/review.model";
import { getTopSellHelper, solvePriceStock } from "../admin/product.controller";
import { groupByArray } from "../../../helpers/groupBy";

enum ProductType {
  SIMPLE = "simple",
  VARIATION = "variations",
}

const merge = (arr1: any[], arr2: any[], value = "asc") => {
  const len1 = arr1.length,
    len2 = arr2.length;
  let i = 0,
    j = 0;
  let res = [];
  if (value === "asc") {
    while (i < len1 && j < len2) {
      if (arr1[i].price < arr2[j].rangePrice.min) {
        res.push(arr1[i]);
        ++i;
      } else {
        res.push(arr2[j]);
        ++j;
      }
    }
  } else {
    while (i < len1 && j < len2) {
      if (arr1[i].price > arr2[j].rangePrice.max) {
        res.push(arr1[i]);
        ++i;
      } else {
        res.push(arr2[j]);
        ++j;
      }
    }
  }

  while (i < len1) {
    res.push(arr1[i]);
    ++i;
  }
  while (j < len2) {
    res.push(arr2[j]);
    ++j;
  }

  return res;
};

// [GET] /products
export const products = async (req: Request, res: Response) => {
  try {
    let find: any = {
      deleted: false,
    };

    const keyword = req.query.q;

    const variations = await Variation.find({ deleted: false });

    const varsKeyMap = variations.map((item) => item.key);

    const variationKeys = [];

    for (const key in req.query) {
      if (varsKeyMap.includes(key) && req.query[key]) {
        variationKeys.push(req.query[key]);
      }
    }

    if (variationKeys.length > 0) {
      find["productType"] = "variations";
      const variationOptions = await VariationOption.find({
        key: { $in: variationKeys },
        deleted: false,
      });
      const idsOptions = variationOptions.map((item) => item.id);
      const subOptions = await SubProductOption.find({
        variation_option_id: { $in: idsOptions },
        deleted: false,
      });

      const subOptionMap = groupByArray(subOptions, "sub_product_id");

      const subIds = [];
      subOptionMap.forEach((val, key) => {
        if (val.length >= idsOptions.length) {
          subIds.push(key);
        }
      });

      const subs = await SubProduct.find({
        deleted: false,
        _id: { $in: subIds },
      });
      const idsProducs = subs.map((item) => item.product_id);
      find["_id"] = { $in: idsProducs };
    }

    if (keyword) {
      find = {
        ...find,
        $or: [
          { title: { $regex: keyword, $options: "si" } },
          { slug: { $regex: keyword, $options: "si" } },
        ],
      };
    }

    const filter_cats = (req.query.filter_cats as string) || "";
    if (filter_cats) {
      const cats = filter_cats.split(",");

      if (cats.length > 0) {
        find.categories = { $in: cats };
      }
    }

    const supplier_id = req.query.supplier_id;

    if (supplier_id) {
      find.supplier_id = supplier_id;
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

    const sort = (req.query.sort || "createdAt-desc").toString().split("-");
    const sort_key = sort[0];
    const sort_value = sort[1];
    const objectSort = {};

    objectSort[`${sort_key}`] = `${sort_value}`;

    //price
    const min_price = req.query.min_price;
    const max_price = req.query.max_price;

    if (min_price !== undefined && max_price !== undefined) {
      let data = [];

      const products = await Product.find(find)
        .sort(sort_key !== "price" ? objectSort : null)
        .lean();

      const skip = objectPagination.skip;
      const limit = objectPagination.limitItems;

      const ids = products.map((item) => item._id);

      const subProducts = await SubProduct.find({
        $and: [
          { deleted: false },
          { product_id: { $in: ids } },
          { price: { $gte: Number(min_price) } },
          { price: { $lte: Number(max_price) } },
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
          if (
            product.price >= Number(min_price) &&
            product.price <= Number(max_price)
          ) {
            data.push(product);
          }
        }
      }

      const response = [];
      totalRecord = data.length;
      const totalPage = Math.ceil(totalRecord / limit);

      const arr1 = data.filter((item) => item.productType === "simple");
      const arr2 = data.filter((item) => item.productType === "variations");

      if (sort_key === "price") {
        let newArr1 = [],
          newArr2 = [];
        if (sort_value === "asc") {
          newArr1 = [...arr1].sort((a, b) => (a.price < b.price ? -1 : 1));
          newArr2 = [...arr2].sort((a, b) =>
            a.rangePrice.min < b.rangePrice.min ? -1 : 1
          );
          data = merge(newArr1, newArr2, sort_value);
        } else {
          newArr1 = [...arr1].sort((a, b) => (a.price < b.price ? 1 : -1));
          newArr2 = [...arr2].sort((a, b) =>
            a.rangePrice.max < b.rangePrice.max ? 1 : -1
          );
          data = merge(newArr1, newArr2, sort_value);
        }
      }

      for (let i = skip; i < Math.min(limit + skip, data.length); i++) {
        response.push(data[i]);
      }

      const suppliers = await Supplier.find({
        _id: { $in: response.map((pro) => pro.supplier_id) },
        deleted: false,
      }).lean();

      const supplierMap = new Map();
      for (const sup of suppliers) {
        supplierMap.set(String(sup._id), { ...sup });
      }

      for (const product of response) {
        const supplier = supplierMap.get(product.supplier_id);
        product["supplierName"] = supplier.name;
      }

      res.json({
        code: 200,
        message: "OK",
        data: {
          products: response,
          totalRecord: totalRecord,
          totalPage: totalPage,
        },
      });
      return;
    }

    if (sort_key === "price") {
      const products = await Product.find({
        $and: [find, { productType: "simple" }],
      })
        .sort(objectSort)
        .lean();

      const productsHasVariations = await Product.find({
        $and: [find, { productType: "variations" }],
      }).lean();

      const idsProducts = productsHasVariations.map((pro) => pro._id);
      const subProducts = await SubProduct.find({
        product_id: { $in: idsProducts },
        deleted: false,
      }).lean();

      for (const item of productsHasVariations) {
        const subs = subProducts.filter(
          (sub) => sub.product_id === String(item._id)
        );
        solvePriceStock(item, subs);
      }

      let newProductHasVariations = [];

      if (sort_value === "asc") {
        newProductHasVariations = [...productsHasVariations].sort((a, b) =>
          a[`rangePrice`].min < b[`rangePrice`].min ? -1 : 1
        );
      } else {
        newProductHasVariations = [...productsHasVariations].sort((a, b) =>
          a[`rangePrice`].max < b[`rangePrice`].max ? 1 : -1
        );
      }

      const response = [];

      const arrMerge = merge(products, newProductHasVariations, sort_value);

      for (
        let i = objectPagination.skip;
        i <
        Math.min(
          totalRecord,
          objectPagination.limitItems + objectPagination.skip
        );
        i++
      ) {
        response.push(arrMerge[i]);
      }

      res.json({
        message: "OK",
        data: {
          products: response,
          totalRecord: totalRecord,
          totalPage: objectPagination.totalPage,
        },
      });
      return;
    }

    const products = await Product.find(find)
      .skip(objectPagination.skip)
      .limit(objectPagination.limitItems)
      .sort(sort_key !== "price" ? objectSort : null)
      .lean();

    for (const pro of products) {
      const subProducts = await SubProduct.find({
        product_id: pro._id,
        deleted: false,
      });

      const supplier = await Supplier.findOne({ _id: pro.supplier_id });
      pro["supplierName"] = supplier.name;

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
        totalPage: objectPagination.totalPage,
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

// [GET] /products/detail/:slug
export const detail = async (req: Request, res: Response) => {
  try {
    const slug = req.params.slug;

    if (!slug) {
      throw Error("Missing slug!!");
    }

    const product = await Product.findOne({
      slug: slug,
      deleted: false,
    }).lean();

    if (!product) {
      throw Error("Product not found!!");
    }

    const supplier = await Supplier.findOne({ _id: product.supplier_id });

    if (supplier) {
      product[`supplierName`] = supplier.name;
    }

    const reviews = await Review.find({
      product_id: product._id,
      deleted: false,
    });

    const numberPeople = reviews.length;
    const average = Math.round(
      reviews.reduce((val, item) => val + item.star, 0) / numberPeople
    );

    product["review"] = {
      numberPeople,
      average,
    };

    if (product.productType === ProductType.VARIATION) {
      const subProducts = await SubProduct.find({
        product_id: product._id,
        deleted: false,
      }).lean();

      if (subProducts.length > 0) {
        solvePriceStock(product, subProducts);
      }

      const subIds = subProducts.map((item) => String(item._id));

      const subOptions = await SubProductOption.find({
        sub_product_id: { $in: subIds },
        deleted: false,
      }).lean();

      const subOptionMap = new Map();
      for (const item of subOptions) {
        if (subOptionMap.has(item.sub_product_id)) {
          const options = subOptionMap.get(item.sub_product_id);
          options.push(String(item.variation_option_id));
          subOptionMap.set(item.sub_product_id, [...options]);
        } else {
          subOptionMap.set(item.sub_product_id, [
            String(item.variation_option_id),
          ]);
        }
      }
      for (const item of subProducts) {
        const options = subOptionMap.get(String(item._id));
        if (options) {
          item[`options`] = [...options];
        }
      }

      const optionsIds = subOptions.map((item) => item.variation_option_id);

      const options = await VariationOption.find({
        _id: { $in: optionsIds },
        deleted: false,
      });

      const optionMap = new Map();
      for (const item of options) {
        if (optionMap.has(item.variation_id)) {
          const options = optionMap.get(item.variation_id);
          options.push({
            title: item.title,
            value: item.id,
            variation_id: item.variation_id,
          });
          optionMap.set(item.variation_id, [...options]);
        } else {
          optionMap.set(item.variation_id, [
            {
              title: item.title,
              value: item.id,
              variation_id: item.variation_id,
            },
          ]);
        }
      }

      const variationIds = options.map((item) => item.variation_id);

      const variations = await Variation.find({
        _id: { $in: variationIds },
        deleted: false,
      }).lean();

      for (const item of variations) {
        const options = optionMap.get(String(item._id));
        if (options) {
          item["options"] = [...options];
        }
      }
      res.json({
        code: 200,
        message: "OK",
        data: {
          product,
          subProducts,
          variations,
        },
      });
      return;
    }

    res.json({
      code: 200,
      message: "OK",
      data: {
        product,
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

//[GET] /products/get-price
export const getPriceProduct = async (req: Request, res: Response) => {
  try {
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
  } catch (error) {
    res.json({
      code: 400,
      message: error.message || error,
    });
  }
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
      find[`title`] = { $regex: keyword, $options: "si" };
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
            // const allSubs = await SubProduct.find({
            //   product_id: product._id,
            //   deleted: false,
            // });
            const allSubs = subMap.get(String(product._id));

            solvePriceStock(product, allSubs);
            data.push(product);
          }

          // const subProducts = await SubProduct.find({
          //   $and: [
          //     { deleted: false, product_id: product._id },
          //     { price: { $gte: price[0] } },
          //     { price: { $lte: price[1] } },
          //   ],
          // });
          // if (subProducts.length > 0) {
          //   const allSubs = await SubProduct.find({
          //     product_id: product._id,
          //     deleted: false,
          //   });
          //   solvePriceStock(product, allSubs);
          //   data.push(product);
          // }
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

//[GET] /products/best-seller
export const getBestSeller = async (req: Request, res: Response) => {
  try {
    const { products_info } = await getTopSellHelper(req);

    for (const product of products_info) {
      const supplier = await Supplier.findOne({ _id: product.supplier_id });
      product["supplierName"] = supplier.name;
    }

    res.json({
      code: 200,
      message: "OK",
      data: products_info,
    });
  } catch (error) {
    res.json({
      code: 400,
      message: error.message || error,
    });
  }
};

//[GET] /products/related
export const getRelatedProduct = async (req: Request, res: Response) => {
  try {
    const product_id = req.query.product_id;
    const product = await Product.findOne({ _id: product_id });

    const categories = product.categories;

    const products = await Product.find({
      deleted: false,
      categories: { $in: categories },
    })
      .limit(4)
      .lean();

    for (const product of products) {
      if (product.productType === ProductType.VARIATION) {
        const subProducts = await SubProduct.find({
          deleted: false,
          product_id: product._id,
        });

        if (subProducts.length > 0) {
          solvePriceStock(product, subProducts);
        }
      }
      const supplier = await Supplier.findOne({ _id: product.supplier_id });
      product["supplierName"] = supplier.name;
    }

    res.json({
      code: 200,
      message: "OK",
      data: {
        products,
      },
    });
  } catch (error) {
    res.json({
      code: 400,
      message: error.message || error,
    });
  }
};

//[GET] /products/variations
export const getVariationOptions = async (req: Request, res: Response) => {
  try {
    const variationOptions = await VariationOption.find({ deleted: false })
      .select("title variation_id key")
      .lean();
    const variations = await Variation.find({ deleted: false }).lean();
    const map = groupByArray(variationOptions, "variation_id");

    for (const variation of variations) {
      variation["options"] = map.get(String(variation._id)) || [];
    }

    res.json({
      code: 200,
      message: "Variations OK!",
      data: {
        variations,
      },
    });
  } catch (error) {
    res.json({
      code: 400,
      message: error.message || error,
    });
  }
};
