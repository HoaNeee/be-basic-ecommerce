import { GoogleGenAI } from "@google/genai";
import { Request, Response } from "express";
import Blog from "../../models/blog.model";
import Category from "../../models/category.model";
import Variation from "../../models/variation.model";
import VariationOption from "../../models/variationOption.model";
import Supplier from "../../models/supplier.model";
import { getQdrantClient } from "../../../configs/database";
import { NAMESPACE_UUID } from "../../../helpers/constant";
import { v5 as uuidv5 } from "uuid";

const API_KEY = process.env.GOOGLE_GEM_AI_API_KEY;
const DOMAIN =
  process.env.NODE_ENV === "production"
    ? "https://shop.kakrist.site"
    : "http://localhost:3000";

const gemAI = new GoogleGenAI({ apiKey: API_KEY });

//[POST] /ai-assistant/blog
export const aiAssistantBlog = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { input } = req.body;

    const blogs = await Blog.find({ deleted: false }, { tags: 1 });
    const tags = Array.from(new Set(blogs.flatMap((blog) => blog.tags)));

    const prompt = `Bạn là một trợ lý ảo của một trang web (thời trang) dành cho admin, nhiệm vụ của bạn là tạo nội dung blog dựa trên các từ khóa được cung cấp.
    
    Dưới đây là các từ khóa: "${input}". 

    - Dữ liệu tham khảo:
      + Đây là các tags có sẵn có thể sử dụng trong bài viết: ${tags.join(
        ", "
      )}.

    Yêu cầu: 
    - Dựa vào từ khóa để tạo một bài viết blog hoàn chỉnh.
    - Content của bài viết phải được trả về dạng HTML, ví dụ: <h1>Tiêu đề</h1><p>Nội dung chi tiết</p>.
    - Content của bài viết phải có độ dài từ 500 đến 1000 từ.
    - Nếu tag mới thì hãy tạo tag mới, nếu tag đã có thì sử dụng tag đã có.
    - Chỉ dùng tiếng anh để tạo tag, còn đâu thì dùng tiếng việt.

    Yêu cầu trả về dạng JSON như sau: 
    {
      "title": "Tiêu đề của bài viết",
      "excerpt": "Mô tả ngắn về bài viết",
      "image": "URL của hình ảnh thumbnail", bạn có thể sử dụng hình ảnh bất kỳ từ internet (Hãy chọn nguồn khác images.unsplash.com)
      "slug": "slug của bài viết, ví dụ: 'tieu-de-cua-bai-viet'",
      "tags": ["tag1", "tag2", ...], bạn có thể tạo các tag phù hợp với nội dung bài viết (hãy dùng tiếng anh để tạo tag),
      "readTime": 5, // thời gian đọc tính bằng phút, bạn có thể ước lượng thời gian đọc dựa trên độ dài của nội dung,
      "content": "<h1>Tiêu đề</h1><p>Nội dung chi tiết</p>",
    }

    `;

    const response = await gemAI.models.generateContent({
      model: "gemini-2.0-flash",
      contents: prompt,
    });

    const data = response.text.slice(
      response.text.indexOf("{"),
      response.text.lastIndexOf("}") + 1
    );

    res.status(200).json({
      code: 200,
      message: "AI Assistant response",
      data: JSON.parse(data),
    });
  } catch (error) {
    console.error("Error in AI Assistant:", error);
    res.status(500).json({
      code: 500,
      message: "Internal server error",
    });
  }
};

//[POST] /ai-assistant/product
export const aiAssistantProduct = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { input } = req.body;

    console.log(input);

    const suppliers = await Supplier.find({ deleted: false }).select("name id");
    const suppliersMap = suppliers.map((supplier) => {
      return `${supplier.id}:${supplier.name}`;
    });

    const categories = await Category.find({ deleted: false }).select(
      "title id"
    );
    const categoriesMap = categories
      .map((cat) => {
        return `${cat.id}:${cat.title}`;
      })
      .join(", ");

    const variations = await Variation.find({ deleted: false }).select(
      "title id"
    );

    const variationMap = variations
      .map((variation) => {
        return `${variation.id}:${variation.title}`;
      })
      .join(", ");

    const variation_ids = variations.map((variation) => variation.id);

    const options = await VariationOption.find({
      variation_id: { $in: variation_ids },
      deleted: false,
    })
      .select("title id variation_id")
      .lean();

    const optionsMap = options
      .map((option) => {
        return `${String(option._id)}:${option.title} (${option.variation_id})`;
      })
      .join(", ");

    const prompt = `Bạn là một trợ lý ảo của một trang web (thời trang) dành cho admin, nhiệm vụ của bạn là tạo 1 sản phẩm hoàn chỉnh dựa trên các từ khóa được cung cấp.
    
    Dưới đây là các từ khóa: "${input}". 

    - Dữ liệu tham khảo:
      + Đây là các danh mục có sẵn có thể sử dụng trong sản phẩm: ${categoriesMap}.
      + Đây là các biến thể có sẵn có thể sử dụng trong sản phẩm: ${variationMap}.
      + Đây là các tùy chọn có sẵn của các biến thể có thể sử dụng trong sản phẩm: ${optionsMap}.
      + Đây là các nhà cung cấp có sẵn có thể sử dụng trong sản phẩm: ${suppliersMap.join(
        ", "
      )}.

    Yêu cầu: 
    - Hãy nhớ rằng bạn có thể chọn kiểu sản phẩm là "simple" hoặc "variations" (hoặc dựa vào từ khóa đã cho để xác định kiểu).
    - Các nguồn ảnh không nên lấy: cdn.pixabay.com, images.unsplash.com, cdn.shopify.com.
    - Các nguồn ảnh có thể lấy: https://images.pexels.com,...
    - Nếu sản phẩm là "simple", bạn hãy bỏ qua các biến thể và tùy chọn.
    - Content của sản phẩm phải được trả về dạng HTML, ví dụ: <h1>Tiêu đề</h1><p>Nội dung chi tiết</p>.
    - SKU của sản phẩm phải là duy nhất, bao gồm các ký tự chữ và số, cách nhau bằng dấu "-", tất cả ký tự phải được viết hoa.


    Yêu cầu nếu sản phẩm là "variations":
    - Nếu sản phẩm là "variations", bạn hãy sử dụng các biến thể và tùy chọn tương ứng, chỉ cần chọn id.
    - Hãy tạo ra đầy đủ các tổ hợp bạn đã chọn với options và variations tương ứng.
    - Hãy nhớ đổi với key_combi của subProduct là chuỗi kết hợp các tùy chọn, ví dụ: "option1-option2".
    - Hãy cố gắng thông tin các subProduct là khác nhau, ví dụ: giá, tồn kho, thumbnail, SKU, giá đã giảm (nếu có), chi phí (nếu có).
    - Dạng trả về của các tổ hợp là một mảng các subProducts, mỗi subProduct bao gồm:
    {
      "key_combi": "key1-key2", // chuỗi kết hợp các tùy chọn, ví dụ: "option1-option2"
      "price": "Giá của sản phẩm con",
      "thumbnail": "Hình ảnh đại diện của subProduct",
      "stock": "Số lượng tồn kho của subProduct",
      "SKU": "Mã SKU của subProduct",
      "discountedPrice": "Giá đã giảm của subProduct (nếu có)",
      "cost": "Chi phí của subProduct (nếu có)"
    }

    Yêu cầu trả về dạng JSON như sau: 
    {
      "title": "Tiêu đề của sản phẩm (chỉ cần tiêu đề, không cần mô tả)",
      "content": "Nội dung chi tiết của sản phẩm, ví dụ: <h1>Tiêu đề</h1><p>Nội dung chi tiết</p>",
      "shortDescription": "Mô tả ngắn về sản phẩm",
      "categories": ["id1", "id2", ...], bạn có thể chọn các danh mục phù hợp với sản phẩm (hãy dùng id),
      "price": 100000, // giá của sản phẩm, nếu là variations thì hãy để null,
      "SKU": "Mã SKU của sản phẩm, ví dụ: 'SKU-1234'" (nếu là variations thì trả về SKU đại diện),
      "stock": 100, // số lượng tồn kho của sản phẩm, nếu là variations thì hãy để null,
      "productType": "simple" hoặc "variations", tùy thuộc vào kiểu sản phẩm bạn đã chọn,
      "thumbnail": "URL của hình ảnh thumbnail", bạn có thể sử dụng hình ảnh bất kỳ từ internet.
      "album": ["URL1", "URL2", ...], bạn có thể sử dụng hình ảnh bất kỳ từ internet.
      "supplier_id": "", // id của nhà cung cấp, bạn có thể chọn từ danh sách nhà cung cấp đã cho,
      "cost": 80000, // chi phí của sản phẩm (nếu có), nếu là variations thì hãy để null,
      "variation_ids": ["id1", "id2", ...], nếu là variations thì sẽ là mảng các id của các biến thể đã chọn,
      "options_ids": ["id1", "id2", ...], nếu là variations thì sẽ là mảng các id của các tùy chọn đã chọn,
      "sub_products": [ // nếu là variations thì sẽ là mảng các subProduct đã tạo
        {
          "price": 100000, // giá của subProduct
          "thumbnail": "", // hình ảnh đại diện của subProduct
          "stock": 100, // số lượng tồn kho của subProduct
          "SKU": "", // mã SKU của subProduct
          "key_combi": [option1-option2, option1-option3,...], // chuỗi kết hợp các tùy chọn, ví dụ: "option1-option2"
          "sub_product_id": "", // id của subProduct
          "discountedPrice": 90000 // giá đã giảm của subProduct (nếu có)
          "cost": 80000 // chi phí của subProduct (nếu có)
        }
      ]
    }`;

    const response = await gemAI.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
    });

    const data = response.text.slice(
      response.text.indexOf("{"),
      response.text.lastIndexOf("}") + 1
    );

    res.status(200).json({
      code: 200,
      message: "AI Assistant response",
      data: JSON.parse(data),
    });
  } catch (error) {
    console.error("Error in AI Assistant:", error);
    res.status(500).json({
      code: 500,
      message: "Internal server error",
    });
  }
};

export const embedingProduct = async (
  product: any,
  subProducts: any[] = [],
  subOptions: any[] = []
) => {
  if (!product) return;

  const NAMESPACE = NAMESPACE_UUID;

  try {
    const categories = await Category.find({
      _id: { $in: product.categories },
    });

    const qdrantClient = getQdrantClient();

    const max_price = Math.max(...subProducts.map((sub) => sub.price));
    const min_price = Math.min(...subProducts.map((sub) => sub.price));

    if (product.productType === "variations") {
      const option_ids = subOptions
        .map((sub_opt) => sub_opt.variation_option_id)
        .flat();

      const options = await VariationOption.find({
        _id: { $in: option_ids },
        deleted: false,
      }).select("title key");

      const inputs = [];
      const payloads = [];

      let cnt = 1;

      for (const sub of subProducts) {
        const sub_options = options.filter((opt) => {
          const subs = subOptions.filter(
            (it) => String(it.sub_product_id) === String(sub._id)
          );
          return subs.some(
            (sub) => String(sub.variation_option_id) === String(opt._id)
          );
        });
        sub["options"] = sub_options;
        const description = `
          ${product.title},
          ${product.SKU},
          ${sub.SKU},
          ${product.shortDescription},
          ${
            sub?.options
              ? `${sub.options.map((opt: any) => opt.title).join(", ")}`
              : ""
          },
          Categories: ${categories.map((cat) => cat.title).join(", ")}
        `;

        if (cnt === 1) {
          console.log(description);
          ++cnt;
        }

        inputs.push(description);
        payloads.push({
          _id: String(sub._id),
          product_id: String(product._id),
          title: product.title,
          options: sub_options.map((opt) => opt.title).join(", "),
          shortDescription: product.shortDescription,
          productType: product.productType,
          categories: product.categories,
          slug: product.slug,
          price: sub.price,
          discountedPrice:
            sub.discountedPrice !== undefined && sub.discountedPrice !== null
              ? sub.discountedPrice
              : null,
          thumbnail: sub.thumbnail,
          SKU: sub.SKU,
          thumbnail_product: product.thumbnail,
        });
      }
      const description_product = `
    ${product.title},
    ${product.SKU},
    ${product.shortDescription},
    Categories: ${categories.map((cat) => cat.title).join(", ")}
    `;

      inputs.push(description_product);

      const response = await gemAI.models.embedContent({
        model: "gemini-embedding-001",
        contents: inputs,
        config: {
          outputDimensionality: 1536,
        },
      });

      const vectors = response.embeddings.map((embedding) => embedding.values);
      const vector_product = vectors[vectors.length - 1];

      await Promise.all(
        vectors.slice(0, vectors.length - 1).map(async (vector, index) => {
          try {
            await qdrantClient.getCollection("sub-products");
          } catch (error) {
            await qdrantClient.createCollection("sub-products", {
              vectors: {
                size: vector.length,
                distance: "Cosine",
              },
            });
          }

          const sub_uuid = uuidv5(String(subProducts[index]._id), NAMESPACE);

          return qdrantClient.upsert("sub-products", {
            points: [
              {
                id: sub_uuid,
                vector: vector,
                payload: payloads[index],
              },
            ],
          });
        })
      );

      const product_uuid = uuidv5(String(product._id), NAMESPACE);

      try {
        await qdrantClient.getCollection("products");
      } catch (error) {
        await qdrantClient.createCollection("products", {
          vectors: {
            size: vector_product.length,
            distance: "Cosine",
          },
        });
      }

      await qdrantClient.upsert("products", {
        points: [
          {
            id: product_uuid,
            vector: vector_product,
            payload: {
              _id: String(product._id),
              title: product.title,
              shortDescription: product.shortDescription,
              categories: product.categories,
              price: product.price,
              rangePrice: {
                min: min_price,
                max: max_price,
              },
              min_price:
                product.productType === "variations" ? min_price : null,
              max_price:
                product.productType === "variations" ? max_price : null,
              thumbnail: product.thumbnail,
              SKU: product.SKU,
              slug: product.slug,
              supplier_id: product.supplier_id,
              productType: product.productType,
            },
          },
        ],
      });

      return;
    }

    const description = `
    ${product.title},
    ${product.SKU},
    ${product.shortDescription},
    Categories: ${categories.map((cat) => cat.title).join(", ")}
    `;

    console.log(description);

    const response = await gemAI.models.embedContent({
      model: "gemini-embedding-001",
      contents: description,
      config: {
        outputDimensionality: 1536,
      },
    });

    const vector = response.embeddings[0].values;

    try {
      await qdrantClient.getCollection("products");
    } catch (error) {
      await qdrantClient.createCollection("products", {
        vectors: {
          size: vector.length,
          distance: "Cosine",
        },
      });
    }
    const product_uuid = uuidv5(String(product._id), NAMESPACE);

    await qdrantClient.upsert("products", {
      points: [
        {
          id: product_uuid,
          vector: vector,
          payload: {
            _id: String(product._id),
            title: product.title,
            shortDescription: product.shortDescription,
            categories: product.categories,
            price: product.price,
            min_price: product.productType === "variations" ? min_price : null,
            max_price: product.productType === "variations" ? max_price : null,
            thumbnail: product.thumbnail,
            SKU: product.SKU,
            slug: product.slug,
            supplier_id: product.supplier_id,
            productType: product.productType,
            discountedPrice:
              product.discountedPrice !== undefined &&
              product.discountedPrice !== null
                ? product.discountedPrice
                : null,
            rangePrice:
              product.productType === "variations"
                ? {
                    min: min_price,
                    max: max_price,
                  }
                : null,
          },
        },
      ],
    });
  } catch (error) {
    throw error;
  }
};
