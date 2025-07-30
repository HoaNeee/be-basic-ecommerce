import { Request, Response } from "express";
import Pagination from "../../../helpers/pagination";
import SubProduct from "../../models/subProduct.model";
import SubProductOption from "../../models/subProductOption.model";
import Product from "../../models/product.model";
import Variation from "../../models/variation.model";
import VariationOption from "../../models/variationOption.model";
import Supplier from "../../models/supplier.model";
import Review from "../../models/review.model";
import { getTopSellHelper, solvePriceStock } from "../../../utils/product";
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

async function handleVariationFilters(req: Request, find: any) {
  const variations = await Variation.find({ deleted: false }).lean();
  const varsKeyMap = variations.map((item) => item.key);
  const variationKeys = [];

  for (const key in req.query) {
    if (varsKeyMap.includes(key) && req.query[key]) {
      variationKeys.push(req.query[key]);
    }
  }

  if (variationKeys.length > 0) {
    find.productType = ProductType.VARIATION;

    const variationOptions = await VariationOption.find({
      key: { $in: variationKeys },
      deleted: false,
    }).lean();

    const idsOptions = variationOptions.map((item) => String(item._id));
    const subOptions = await SubProductOption.find({
      variation_option_id: { $in: idsOptions },
      deleted: false,
    }).lean();

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
    }).lean();

    const idsProducts = subs.map((item) => item.product_id);
    find._id = { $in: idsProducts };
  }
}

async function handlePriceFilter(
  req: Request,
  res: Response,
  find: any,
  objectPagination: any,
  sort_key: string,
  sort_value: string,
  min_price: number,
  max_price: number
) {
  const objSort: any = { [sort_key]: sort_value };

  const products = await Product.find(find)
    .sort(sort_key !== "price" ? objSort : {})
    .lean();

  const { skip, limitItems: limit } = objectPagination;
  const ids = products.map((item) => String(item._id));

  const [subProductsInRange, allSubs] = await Promise.all([
    SubProduct.find({
      deleted: false,
      product_id: { $in: ids },
      price: { $gte: min_price, $lte: max_price },
    }).lean(),
    SubProduct.find({
      deleted: false,
      product_id: { $in: ids },
    }).lean(),
  ]);

  const subSet = new Set(
    subProductsInRange.map((item) => String(item.product_id))
  );
  const subMap = groupByArray(allSubs, "product_id");

  const data = [];
  for (const product of products) {
    if (product.productType === ProductType.VARIATION) {
      if (subSet.has(String(product._id))) {
        const productSubs = subMap.get(String(product._id)) || [];
        solvePriceStock(product, productSubs);
        data.push(product);
      }
    } else {
      if (product.price >= min_price && product.price <= max_price) {
        data.push(product);
      }
    }
  }

  if (sort_key === "price") {
    sortProductsByPrice(data, sort_value);
  }

  const response = data.slice(skip, skip + limit);
  const totalRecord = data.length;
  const totalPage = Math.ceil(totalRecord / limit);

  await productsWithSupplierData(response);

  res.json({
    code: 200,
    message: "OK",
    data: {
      products: response,
      totalRecord,
      totalPage,
    },
  });
}

async function handlePriceSorting(
  req: Request,
  res: Response,
  find: any,
  objectPagination: any,
  objectSort: any,
  sort_value: string
) {
  const [simpleProducts, variationProducts] = await Promise.all([
    Product.find({ ...find, productType: ProductType.SIMPLE })
      .sort(objectSort)
      .lean(),
    Product.find({ ...find, productType: ProductType.VARIATION }).lean(),
  ]);

  if (variationProducts.length > 0) {
    const idsProducts = variationProducts.map((pro) => pro._id);
    const subProducts = await SubProduct.find({
      product_id: { $in: idsProducts },
      deleted: false,
    }).lean();

    const subMap = groupByArray(subProducts, "product_id");

    for (const item of variationProducts) {
      const subs = subMap.get(String(item._id)) || [];
      solvePriceStock(item, subs);
    }

    variationProducts.sort((a, b) => {
      const priceA =
        sort_value === "asc" ? a["rangePrice"]?.min : a["rangePrice"]?.max;
      const priceB =
        sort_value === "asc" ? b["rangePrice"]?.min : b["rangePrice"]?.max;
      return sort_value === "asc" ? priceA - priceB : priceB - priceA;
    });
  }

  // Merge and paginate
  const arrMerge = merge(simpleProducts, variationProducts, sort_value);
  const totalRecord = arrMerge.length;
  const response = arrMerge.slice(
    objectPagination.skip,
    objectPagination.skip + objectPagination.limitItems
  );

  res.json({
    code: 200,
    message: "OK",
    data: {
      products: response,
      totalRecord,
      totalPage: objectPagination.totalPage,
    },
  });
}

function sortProductsByPrice(data: any[], sort_value: string) {
  const simpleProducts = data.filter(
    (item) => item.productType === ProductType.SIMPLE
  );
  const variationProducts = data.filter(
    (item) => item.productType === ProductType.VARIATION
  );

  if (sort_value === "asc") {
    simpleProducts.sort((a, b) => a.price - b.price);
    variationProducts.sort((a, b) => a.rangePrice.min - b.rangePrice.min);
  } else {
    simpleProducts.sort((a, b) => b.price - a.price);
    variationProducts.sort((a, b) => b.rangePrice.max - a.rangePrice.max);
  }

  data.length = 0;
  data.push(...merge(simpleProducts, variationProducts, sort_value));
}

async function productsWithSupplierData(products: any[]) {
  if (products.length === 0) return;

  const supplierIds = [...new Set(products.map((pro) => pro.supplier_id))];
  const suppliers = await Supplier.find({
    _id: { $in: supplierIds },
    deleted: false,
  }).lean();

  const supplierMap = new Map();
  for (const sup of suppliers) {
    supplierMap.set(String(sup._id), sup);
  }

  for (const product of products) {
    const supplier = supplierMap.get(String(product.supplier_id));
    product.supplierName = supplier?.name || "Unknown";
  }
}

async function productsWithSupplierAndSubProducts(products: any[]) {
  if (products.length === 0) return;

  const productIds = products.map((pro) => pro._id);
  const supplierIds = [...new Set(products.map((pro) => pro.supplier_id))];

  const [subProducts, suppliers] = await Promise.all([
    SubProduct.find({
      product_id: { $in: productIds },
      deleted: false,
    }).lean(),
    Supplier.find({
      _id: { $in: supplierIds },
      deleted: false,
    }).lean(),
  ]);

  const subMap = groupByArray(subProducts, "product_id");
  const supplierMap = new Map();

  for (const sup of suppliers) {
    supplierMap.set(String(sup._id), sup);
  }

  for (const product of products) {
    const supplier = supplierMap.get(String(product.supplier_id));
    product.supplierName = supplier?.name || "Unknown";

    const productSubs = subMap.get(String(product._id)) || [];
    if (productSubs.length > 0) {
      solvePriceStock(product, productSubs);
    }
  }
}

// [GET] /products
export const products = async (req: Request, res: Response) => {
  try {
    let find: any = { deleted: false };

    const keyword = req.query.q;
    if (keyword) {
      find.$or = [
        { title: { $regex: keyword, $options: "si" } },
        { slug: { $regex: keyword, $options: "si" } },
      ];
    }

    const filter_cats = (req.query.filter_cats as string) || "";
    if (filter_cats) {
      const cats = filter_cats.split(",").filter(Boolean);
      if (cats.length > 0) {
        find.categories = { $in: cats };
      }
    }

    const supplier_id = req.query.supplier_id;
    if (supplier_id) {
      find.supplier_id = supplier_id;
    }

    await handleVariationFilters(req, find);

    let totalRecord = await Product.countDocuments(find);
    const objectPagination = Pagination(
      {
        page: 1,
        limitItems: req.query.limit ? Number(req.query.limit) : totalRecord,
      },
      req.query,
      totalRecord
    );

    const sort = (req.query.sort || "createdAt-desc").toString().split("-");
    const [sort_key, sort_value] = sort;
    const objectSort: any = { [sort_key]: sort_value };

    const min_price = req.query.min_price;
    const max_price = req.query.max_price;

    if (min_price !== undefined && max_price !== undefined) {
      return await handlePriceFilter(
        req,
        res,
        find,
        objectPagination,
        sort_key,
        sort_value,
        Number(min_price),
        Number(max_price)
      );
    }

    // Handle price sorting
    if (sort_key === "price") {
      return await handlePriceSorting(
        req,
        res,
        find,
        objectPagination,
        objectSort,
        sort_value
      );
    }

    const products = await Product.find(find)
      .skip(objectPagination.skip)
      .limit(objectPagination.limitItems)
      .sort(objectSort)
      .lean();

    await productsWithSupplierAndSubProducts(products);

    res.json({
      code: 200,
      message: "OK",
      data: {
        products,
        totalRecord,
        totalPage: objectPagination.totalPage,
      },
    });
  } catch (error) {
    console.error("Error in products controller:", error);
    res.status(400).json({
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
