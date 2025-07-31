import { Request, Response } from "express";
import { Chat, GoogleGenAI } from "@google/genai";
import Category from "../../models/category.model";
import Variation from "../../models/variation.model";
import VariationOption from "../../models/variationOption.model";
import Product from "../../models/product.model";
import SubProduct from "../../models/subProduct.model";
import SubProductOption from "../../models/subProductOption.model";
import { groupByArray } from "../../../helpers/groupBy";

const API_KEY = process.env.GOOGLE_GEM_AI_API_KEY;

const gemAI = new GoogleGenAI({ apiKey: API_KEY });

//fix then
const chatHistory = new Map();

// [GET] /chatbot/history
export const getHistoryChat = async (req: Request, res: Response) => {
  try {
    const chat = chatHistory.get(req.session["sid"])?.history || [];
    const formattedChat = chat.slice(2).map((msg: any) => {
      const message = msg.parts[0].text as string;
      if (msg.role === "user") {
        return {
          role: "user",
          content: message.slice(
            message.indexOf('"') + 1,
            message.indexOf('"', message.indexOf('"') + 1)
          ),
        };
      }
      const indexIntent = message.indexOf("intent");
      if (indexIntent !== -1) {
        const mess = message.slice(
          message.indexOf("{"),
          message.lastIndexOf("}") + 1
        );
        const inObj = JSON.parse(mess);
        return {
          role: msg.role,
          intent: inObj.intent,
          content: inObj.response || "No response",
          products: inObj.products || [],
        };
      }
      return {
        role: msg.role,
        intent: "small_talk",
        content: message,
      };
    });

    res.json({
      code: 200,
      message: "Success",
      data: formattedChat,
    });
  } catch (error) {
    res.json({ code: 500, message: "Internal Server Error: " + error.message });
  }
};

// [POST] /chatbot
export const chatBot = async (req: Request, res: Response) => {
  try {
    if (!API_KEY) {
      res.json({ code: 500, message: "API key is not set" });
      return;
    }

    if (!req.session["sid"]) {
      req.session["sid"] = req.sessionID;
    }

    const sessionId = req.session["sid"];

    const chat = await createOrGetChatHistory(chatHistory, sessionId);

    const input1 =
      req.body.message ||
      `Xin chào, bạn thế nào? Chúng ta có thể nói chuyện không!`;
    // const input2 = `Xin chào, tôi đang cần tìm 1 đôi giày, mức giá tầm 100 - 900 đ, size X giúp tôi nhé!`;

    const { intent } = await getIntent(input1);
    console.log("intent", intent);

    // if (intent === "unknown") {
    //   const response = await chat.sendMessage({
    //     message: `Bạn là một trợ lý ảo của một trang web bán hàng, người dùng gửi câu sau "${input1}", Nhưng bạn không hiểu ý định của người dùng.
    //       Hãy trả lời một cách tự nhiên và thân thiện, vui vẻ, trò chuyện với người dùng và hỏi lại rõ ý định của người dùng là gì nhé.
    //     `,
    //   });

    //   res.json({
    //     code: 200,
    //     message: "Chatbot response",
    //     data: {
    //       intent: "small_talk",
    //       response: response.text,
    //     },
    //   });
    //   return;
    // } else

    if (intent === "small_talk") {
      const response = await messageTalk(input1, chat);
      res.json({
        code: 200,
        message: "Chatbot response",
        data: {
          intent: intent,
          response: response,
        },
      });
      return;
    }

    const products = await getProducts(input1);
    const prompt = `Đây là danh sách sản phẩm dưới dạng JSON sau khi phân tích yêu cầu của người dùng "${input1}": ${JSON.stringify(
      products.slice(0, 5)
    )}, 
        Hãy trả lời một cách tự nhiên và thân thiện, vui vẻ, trò chuyện với người dùng và cung cấp thông tin về sản phẩm này nhé.
        - Nếu là câu hỏi đầu tiên thì hãy bắt đầu với xin chào còn không thì không cần xin chào.
        - Nếu không có sản phẩm nào phù hợp hãy trả lời khéo và nói rằng không tìm thấy sản phẩm nào phù hợp với yêu cầu của người dùng.
        - Với response hãy trả về dưới dạng thẻ HTML, ví dụ: <p>Đây là sản phẩm phù hợp với yêu cầu của bạn, chúc bạn tìm được sản phẩm ưng ý nhé!</p>
        Yêu cầu trả lời đúng format dưới dạng JSON như sau: 
        {
          "intent": "search_product",
          "response": "<p>Đây là sản phẩm phù hợp với yêu cầu của bạn, chúc bạn tìm được sản phẩm ưng ý nhé!</p>",
          "products": [danh sách sản phẩm]
        }
        ;
      `;
    const response = await chat.sendMessage({
      message: prompt,
    });
    const output = response.text.slice(
      response.text.indexOf("{"),
      response.text.lastIndexOf("}") + 1
    );
    const data = JSON.parse(output);
    res.json({
      code: 200,
      message: "Chatbot response",
      data: {
        intent: intent,
        response: data.response,
        products: products,
      },
    });
  } catch (error) {
    res.json({ code: 500, message: "Internal Server Error: " + error.message });
  }
};

const createOrGetChatHistory = async (
  map: Map<string, Chat>,
  sessionId: string
) => {
  try {
    if (!map.has(sessionId)) {
      const initialHistory = [
        {
          role: "user",
          parts: [
            {
              text: "Xin chào!, bạn là một chuyên gia về tư vấn, bán hàng trên web mang thương hiệu Kakrist, hãy trả lời người dùng một cách tự nhiên và thân thiện nhé.",
            },
          ],
        },
        {
          role: "model",
          parts: [
            {
              text: "Chào bạn! Rất vui được hỗ trợ bạn tìm kiếm sản phẩm. Bạn đang quan tâm đến loại sản phẩm nào hoặc có nhu cầu cụ thể nào không?",
            },
          ],
        },
      ];

      const newChat = gemAI.chats.create({
        model: "gemini-2.5-flash",
        history: initialHistory,
      });
      map.set(sessionId, newChat);
    }
    return map.get(sessionId);
  } catch (error) {
    console.error("Error creating or getting chat history:", error);
    throw error;
  }
};

const getIntent = async (input: string) => {
  try {
    const classicPrompt = `Bạn là một trợ lý ảo của một trang web bán hàng, người dùng gửi câu sau "${input}"
      Hãy trả về 'intent' chính xác nhất trong số các intent sau:
      - "search_product": Tìm kiếm sản phẩm
      - "small_talk": Nói chuyện nhỏ

      Chỉ trả về dạng JSON: { "intent": "..." }
    `;

    const response = await gemAI.models.generateContent({
      model: "gemini-2.5-flash",
      contents: classicPrompt,
    });

    const output = response.text.slice(
      response.text.indexOf("{"),
      response.text.lastIndexOf("}") + 1
    );

    return JSON.parse(output);
  } catch (error) {
    console.error("Error occurred while getting intent:", error);
    throw error;
  }
};

const messageTalk = async (input: string, chat: Chat) => {
  try {
    const prompt = `Bạn là một trợ lý ảo của một trang web bán hàng và là một người bạn siêu hiểu biết, hãy trả lời một cách tự nhiên và thân thiện, vui vẻ, trò chuyện với người dùng. 
    - Người dùng gửi câu sau "${input}"

    - Yêu cầu: 
    - Trả message về dưới dạng thẻ HTML, ví dụ: <p>Tôi khỏe, còn bạn</p>.
    - Nếu là câu hỏi đầu tiên thì hãy bắt đầu với xin chào còn không thì không cần xin chào.
    - Nếu người dùng muốn trò chuyện, hãy hỗ trợ họ một cách tự nhiên và thân thiện.
    - Trả kết quả dưới dạng JSON như sau:
    {
      "intent": "small_talk",
      "response": "<p>Tôi khỏe, còn bạn</p>"
    }

    `;

    const response = await chat.sendMessage({
      message: prompt,
    });

    const output = response.text.slice(
      response.text.indexOf("{"),
      response.text.lastIndexOf("}") + 1
    );

    return JSON.parse(output).response;
  } catch (error) {
    console.error("Error occurred while talking message:", error);
    throw error;
  }
};

const promptQuery = async (prompt: string, input: string) => {
  try {
    const response = await gemAI.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
    });

    const output = response.text.slice(
      response.text.indexOf("{"),
      response.text.lastIndexOf("}") + 1
    );

    return output;
  } catch (error) {
    console.error("Error occurred while querying message:", error);
    throw error;
  }
};

const getProducts = async (input: string) => {
  try {
    const categories = await Category.find({ deleted: false })
      .select("title")
      .lean();
    const categoriesMap = categories
      .map((cat) => {
        return `${cat.title}:${String(cat._id)}`;
      })
      .join(", ");

    const variations = await Variation.find({ deleted: false })
      .select("title _id")
      .lean();
    const variationIds = variations.map((variation) =>
      variation._id.toString()
    );

    const variationOptions = await VariationOption.find({
      variation_id: { $in: variationIds },
      deleted: false,
    })
      .select("title _id")
      .lean();

    const optionsMap = variationOptions
      .map((opt) => {
        return `${opt.title}:${String(opt._id)}`;
      })
      .join(",");

    const prompt = `Bạn là một trợ lý ảo của một trang web bán hàng, nhiệm vụ của bạn là phân tích yêu cầu của người dùng và xuất ra dữ liệu có cấu trúc dạng JSON theo mẫu bên dưới. Không cần giải thích gì thêm.

    Người dùng hỏi: "${input}"

    Dữ liệu tham khảo:
    - Danh sách danh mục (dạng: tên:danh_mục_id): ${categoriesMap}
    - Danh sách tùy chọn biến thể (dạng: tên:option_id): ${optionsMap}

    Yêu cầu:
    - Trích xuất tiêu đề sản phẩm nếu có (title nếu là tiếng việt thì chuyển sang tiếng anh, và nên để tối đa 1 từ mà bạn thấy có thể search ví dụ: Đôi giày Nike xịn -> "shoes" hoặc "Nike", Áo thun đẹp -> "tshirt")
    - Nếu có nói về mức giá, hãy lấy giá trung bình (price), cùng với khoảng min_price và max_price dao động ±10%
    - Nếu có tên danh mục sản phẩm phù hợp, trả về mảng 'categories' là danh sách '_id' tương ứng
    - Trường 'productType' là "variations" nếu có biến thể, "simple" nếu không, biến thể là các tùy chọn như màu sắc, kích thước.. (nếu có).
    - Nếu có đề cập đến tùy chọn như màu, size..., hãy trả về 'variation_options' là danh sách '_id' phù hợp

    Kết quả trả về chỉ là JSON theo mẫu sau:

    {
      "title": "...",
      "productType": "variations",
      "price": "100",
      "min_price": "95",
      "max_price": "105",
      "categories": ["id1", "id2"],
      "variation_options": ["id3", "id4"]
    }
    hoặc
    {
      "title": "...",
      "productType": "simple",
      "price": "100",
      "min_price": "95",
      "max_price": "105",
      "categories": ["id1", "id2"],
      "variation_options": []
    }
    `;

    const output = await promptQuery(prompt, input);

    const object = JSON.parse(output);

    let find: any = {
      deleted: false,
    };

    if (object.title) {
      find.$text = { $search: object.title };
    }

    if (object.categories && object.categories.length > 0) {
      find.categories = { $in: object.categories };
    }

    if (object.price || object.min_price || object.max_price) {
      find.$or = [
        { price: Number(object.price) },
        {
          price: {
            $gte: Number(object.min_price) || 0,
            $lte: Number(object.max_price) || 10000000000,
          },
        },
      ];
    }

    if (object.productType === "simple") {
      find.productType = "simple";
      const products = await handleProductSimple(find);
      return products.slice(0, 5);
    }
    find.productType = "variations";
    const products = await handleProductVariations(find, object);
    return products.slice(0, 5);
  } catch (error) {
    console.error("Error occurred while getting products:", error);
    throw error;
  }
};

const handleProductSimple = async (find: any) => {
  try {
    console.log("find", find);
    const products = await Product.find(find);

    return products;
  } catch (error) {
    console.error("Error occurred while handling simple product:", error);
    throw error;
  }
};

const handleProductVariations = async (find: any, object: any) => {
  try {
    delete find.$or;
    console.log(find);

    const variation_options = object.variation_options || [];

    const products = await Product.find(find);
    const productIds = products.map((product) => product._id.toString());

    let findSub: any = {
      product_id: { $in: productIds },
      deleted: false,
    };

    if (object.price || object.min_price || object.max_price) {
      findSub.$or = [
        { price: Number(object.price) },
        {
          price: {
            $gte: Number(object.min_price) || 0,
            $lte: Number(object.max_price) || Infinity,
          },
        },
      ];
    }
    const subProducts = await SubProduct.find(findSub).lean();
    const subIds = subProducts.map((sub) => sub._id.toString());

    const [subOptions, options] = await Promise.all([
      SubProductOption.find({
        sub_product_id: { $in: subIds },
        variation_option_id: { $in: variation_options },
        deleted: false,
      }),
      VariationOption.find({
        _id: { $in: variation_options },
        deleted: false,
      }),
    ]);

    const subOptionsMap = groupByArray(subOptions, "sub_product_id");

    const response = [];

    for (const sub of subProducts) {
      if (subOptionsMap.get(sub._id.toString())) {
        const opts = subOptionsMap.get(sub._id.toString());
        sub["options"] = [];
        for (const opt of opts) {
          const optionObject = options.find(
            (o) => o._id.toString() === opt.variation_option_id.toString()
          );
          if (optionObject) {
            sub["options"].push(optionObject);
          }
        }
        const product = products.find(
          (p) => p._id.toString() === sub.product_id.toString()
        );
        sub["slug"] = product ? product.slug : "";
        sub["thumbnail_product"] = product ? product.thumbnail : "";
        sub["title"] = product ? product.title : "";
        response.push(sub);
      }
    }

    return response;
  } catch (error) {
    console.error("Error occurred while handling variations product:", error);
    throw error;
  }
};
