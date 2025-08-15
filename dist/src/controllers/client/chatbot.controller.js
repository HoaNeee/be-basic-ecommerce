"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.chatBot = exports.getHistoryChat = exports.testAPI = void 0;
const genai_1 = require("@google/genai");
const category_model_1 = __importDefault(require("../../models/category.model"));
const variation_model_1 = __importDefault(require("../../models/variation.model"));
const variationOption_model_1 = __importDefault(require("../../models/variationOption.model"));
const product_model_1 = __importDefault(require("../../models/product.model"));
const subProduct_model_1 = __importDefault(require("../../models/subProduct.model"));
const blog_model_1 = __importDefault(require("../../models/blog.model"));
const user_model_1 = __importDefault(require("../../models/user.model"));
const product_1 = require("../../../utils/product");
const supplier_model_1 = __importDefault(require("../../models/supplier.model"));
const database_1 = require("../../../configs/database");
const crypto_1 = __importDefault(require("crypto"));
const textCache_model_1 = __importDefault(require("../../models/textCache.model"));
const convertInput_1 = require("../../../helpers/convertInput");
const API_KEY = process.env.GOOGLE_GEM_AI_API_KEY;
const DOMAIN = process.env.NODE_ENV === "production"
    ? "https://shop.kakrist.site"
    : "http://localhost:3000";
const gemAI = new genai_1.GoogleGenAI({ apiKey: API_KEY });
const testAPI = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        res.status(200).json({
            code: 200,
            message: "Test API OK!",
        });
    }
    catch (error) {
        console.log(error);
        res.status(500).json({
            code: 500,
            message: error.message || error,
        });
    }
});
exports.testAPI = testAPI;
const chatHistory = new Map();
const getHistoryChat = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const chat = ((_a = chatHistory.get(req.session["sid"])) === null || _a === void 0 ? void 0 : _a.history) || [];
        const formattedChat = formattedChatHelper(chat);
        req.session["show_suggestion_begin"] = true;
        if (formattedChat.length > 0) {
            req.session["show_suggestion_begin"] = false;
        }
        res.json({
            code: 200,
            message: "Success",
            data: {
                chats: formattedChat,
                show_suggestion_begin: req.session["show_suggestion_begin"],
            },
            chatNotFormat: chat,
        });
    }
    catch (error) {
        res.json({ code: 500, message: "Internal Server Error: " + error.message });
    }
});
exports.getHistoryChat = getHistoryChat;
const chatBot = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        if (!API_KEY) {
            res.json({ code: 500, message: "API key is not set" });
            return;
        }
        if (!req.session["sid"]) {
            req.session["sid"] = req.sessionID;
        }
        const sessionId = req.session["sid"];
        const chat = yield createOrGetChatHistory(chatHistory, sessionId);
        const input = req.body.message ||
            `Xin chào, bạn thế nào? Chúng ta có thể nói chuyện không!`;
        if (!input || input.trim() === "") {
            res.status(400).json({
                code: 400,
                message: "Input message is required and cannot be empty.",
            });
            return;
        }
        const action = req.body.action || "ask";
        if (action === "suggest") {
            const type = req.body.type;
            const cached = yield checkCaching(input);
            if (cached) {
                const collection_name = ((_a = cached.query) === null || _a === void 0 ? void 0 : _a.collection_name) || "products";
                const vector_ids = cached.response;
                const products = yield getProductWithVectorIds(vector_ids, collection_name);
                req.session["userState"] = {
                    lastIntent: "search_product",
                    new: true,
                    query: {
                        input: input,
                        productType: collection_name === "products" ? "simple" : "variations",
                        points: vector_ids,
                    },
                };
                return yield promptProduct(req, res, input, chat, type, products);
            }
            console.log(type, action);
            if (type === "search_product") {
                const products = yield getProducts(input, {}, req);
                return yield promptProduct(req, res, input, chat, type, products);
            }
            const product = yield getProductUsingInput(input);
            if (!product) {
                res.json({
                    code: 404,
                    message: "Product not found",
                });
                return;
            }
            if (type === "similar_product") {
                const object = {
                    categories: product.categories || [],
                    productType: "simple",
                };
                const similar_products = yield getProducts(input, object, req);
                return yield promptProduct(req, res, input, chat, "search_product", similar_products);
            }
            if (type === "product_detail") {
                return yield promptProductDetail(req, res, input, chat, type, product);
            }
        }
        const intent = yield getIntent(input, req, res, chat);
        console.log("intent", intent);
        if (!intent) {
            return;
        }
        switch (intent) {
            case "product_detail":
                return yield promptProductDetail(req, res, input, chat, intent);
            case "search_blog":
                return yield promptBlog(req, res, input, chat, intent);
            case "website_info":
                res.json({
                    code: 200,
                    message: "Chatbot response",
                    data: {
                        intent: intent,
                        response: `<p>Chức năng thông tin về website chưa được triển khai.</p>`,
                    },
                });
                return;
            case "guide_website":
                return yield promptGuideWebsite(req, res, input, chat);
            case "small_talk":
                const response = yield messageTalk(input, chat);
                res.json({
                    code: 200,
                    message: "Chatbot response",
                    data: {
                        intent: intent,
                        response: response,
                    },
                });
                return;
            default:
                return;
        }
    }
    catch (error) {
        res.json({ code: 500, message: "Internal Server Error: " + error.message });
    }
});
exports.chatBot = chatBot;
const getIntent = (input, req, res, chatModel) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c, _d;
    try {
        const cached = yield checkCaching(input);
        if (cached) {
            const intent = ((_a = cached.query) === null || _a === void 0 ? void 0 : _a.intent) || "search_product";
            if (intent === "search_product") {
                const collection_name = ((_b = cached.query) === null || _b === void 0 ? void 0 : _b.collection_name) || "products";
                const products = yield getProductWithVectorIds(cached.response, collection_name);
                req.session["userState"] = {
                    lastIntent: intent,
                    new: false,
                    query: {
                        input: input,
                        productType: collection_name === "products" ? "simple" : "variations",
                        points: cached.response,
                    },
                };
                yield promptProduct(req, res, input, chatModel, intent, products);
                return "";
            }
            return intent;
        }
        const chat = ((_c = chatHistory.get(req.session["sid"])) === null || _c === void 0 ? void 0 : _c.history) || [];
        const formattedChat = formattedChatHelper(chat);
        let userState = req.session["userState"];
        if (!userState) {
            req.session["userState"] = {
                lastIntent: "",
                lastQuery: {},
            };
            userState = req.session["userState"];
        }
        const [categoriesMap] = yield getCategoriesAndOptions();
        const classicPrompt = `Bạn là một trợ lý ảo của một trang web bán hàng, người dùng gửi câu sau "${input}"
    
      Dữ liệu tham khảo cho việc phân tích intent:
      - Lịch sử trò chuyện: ${JSON.stringify(formattedChat.slice(Math.max(formattedChat.length - 3, 0)))}
      - State của người dùng: ${JSON.stringify(userState)}

      Xác định intent và trả về 'intent' chính xác nhất trong số các intent sau:
      - "search_product": Tìm kiếm sản phẩm
      - "product_detail": Chi tiết sản phẩm
      - "small_talk": Nói chuyện nhỏ
      - "search_blog": Tìm kiếm bài viết
      - "guide_website": Hướng dẫn sử dụng website, ví dụ như: đi tới trang sản phẩm, trang giỏ hàng, trang thanh toán, trang đăng nhập, trang đăng ký, trang chi tiết sản phẩm, "tôi muốn biết trang đơn hàng của tôi ở đâu, tôi muốn biết chỉnh theme thế nào"

      - Nếu intent mới khác với intent trước đó của người dùng, hãy cập nhật state của người dùng với intent mới và query mới (nếu có).
      - Dựa vào input của người dùng để xác định "new" (true nếu bạn nghĩ input là một truy vấn mới, false nếu không).
      - Nếu intent mới giống thì hãy cập nhật userState.lastQuery với query mới (nếu là intent dạng search).
      - Nếu có đề cập đến sản phẩm tương tự thì hãy dựa vào userState.data để lấy product với categories tương ứng và trả về nó.

      - Dữ liệu tham khảo thêm cho việc cập nhật userState.lastQuery:
      - Hãy nhớ đi theo format đã có của userState.
      - Hãy giúp tôi convert input sang tiếng anh.
      - Nếu intent là search_product:
        + Danh sách danh mục (dạng: tên:danh_mục_id): ${categoriesMap}
        + Chú ý: 
          - Trường 'userState.query.productType' là "variations" nếu có biến thể, "simple" nếu không, biến thể là các tùy chọn như màu sắc, kích thước.. (nếu có).
          - Trường 'price' là giá trung bình (price), cùng với khoảng minPrice và maxPrice dao động ±10% (nếu có).

      - Nếu intent là search_blog:
        + Danh sách tags (dạng: tên): ${formattedChat
            .map((msg) => { var _a; return (_a = msg.data) === null || _a === void 0 ? void 0 : _a.map((item) => item === null || item === void 0 ? void 0 : item.tags).join(", "); })
            .join(", ")}
        + Danh sách tiêu đề bài viết cho việc dễ match (dạng: tên): ${formattedChat
            .map((msg) => { var _a; return (_a = msg.data) === null || _a === void 0 ? void 0 : _a.map((item) => item === null || item === void 0 ? void 0 : item.title).join(", "); })
            .join(", ")}

      Chỉ trả về dạng JSON như sau: 
      { 
      "intent": "...",
      "new": true | false, // nếu intent mới khác với intent trước đó hoặc input mới bạn thấy khác hẳn input trước
      "query": {
        "input": "${input}",
        "categories": ["id1", "id2"], // nếu có
        "productType": "simple" | "variations",
        "price": "100000", // nếu có (dựa vào input)
        "minPrice": "50000", // nếu có (dựa vào input)
        "maxPrice": "200000", // nếu có (dựa vào input)
        "tags": ["tag1", "tag2"] // nếu có với search_blog,
      }
    `;
        const response = yield gemAI.models.generateContent({
            model: "gemini-2.0-flash",
            contents: classicPrompt,
        });
        const output = response.text.slice(response.text.indexOf("{"), response.text.lastIndexOf("}") + 1);
        const object = JSON.parse(output);
        console.log(object);
        if ((object === null || object === void 0 ? void 0 : object.intent) === "search_product") {
            if (!object.new) {
                const points = object.query.points;
                if (points && (points === null || points === void 0 ? void 0 : points.length) > 0) {
                    const productType = ((_d = object === null || object === void 0 ? void 0 : object.query) === null || _d === void 0 ? void 0 : _d.productType) || "simple";
                    const products = yield getProductWithVectorIds(points, productType === "simple" ? "products" : "sub-products");
                    return yield promptProduct(req, res, input, chatModel, object.intent, products);
                }
            }
            else {
                const products = yield getProducts(object.input || input, object.query, req);
                yield promptProduct(req, res, input, chatModel, object.intent, products);
            }
            return "";
        }
        return object.intent;
    }
    catch (error) {
        console.error("Error occurred while getting intent:", error);
        throw error;
    }
});
const promptProductDetail = (req, res, input, chat, intent, product) => __awaiter(void 0, void 0, void 0, function* () {
    if (!product) {
        product = yield getProductUsingInput(input);
    }
    if (product) {
        req.session["userState"] = {
            lastIntent: intent,
            new: false,
            query: {
                input: input,
            },
            data: product,
        };
    }
    const prompt = `Bạn là một trợ lý ảo của trang web, dựa vào lịch sử trò chuyện cho việc thông tin chi tiết sản phẩm, hãy trả lời một cách tự nhiên và thân thiện, vui vẻ, trò chuyện với người dùng.
        - Người dùng gửi câu sau "${input}"
        Dữ liệu tham khảo:
        - Đây là sản phẩm cho việc phân tích sản phẩm (có thể không có): ${JSON.stringify(product)}
        - Đây là domain của trang web: ${DOMAIN}
        - Nếu không có dữ liệu sản phẩm ở phía trên thì hãy dựa vào lịch sử của đoạn chat để tìm kiếm thông tin sản phẩm.

        Yêu cầu:
        - Hãy linh hoạt trong việc chọn ngôn ngữ, nhưng ưu tiên Tiếng việt nhé.
        - Hỏi xem người dùng có muốn qua trang chi tiết sản phẩm không.
        - Bạn có thể đưa link chi tiết sản phẩm vào (nếu sử dụng thẻ a, hãy thêm 1 chút css), link chi tiết sản phẩm là: ${DOMAIN}/shop/slug-product
        - Hỏi xem người dùng có muốn tự động chuyển hướng đến trang chi tiết sản phẩm không, nếu có hãy trả về thêm trường "auto_redirect": true, và "redirect_url": "${DOMAIN}/shop/slug-product", tôi sẽ tự re-direct người dùng đến trang chi tiết sản phẩm.
        - Hãy nhớ luôn hỏi người dùng trước khi muốn tự động chuyển hướng, nếu người dùng khẳng định muốn tự động chuyển hướng thì hãy trả về trường auto_redirect là true và redirect_url là đường dẫn mà bạn muốn chuyển hướng.
        - Nếu người dùng xác nhận muốn tự động chuyển hướng thì hãy mô phỏng timeout 2 giây (css cho spin, hoặc bạn có thể làm gì đó) để tôi có thể tự động chuyển hướng đến trang chi tiết sản phẩm.
        - Trả lời đúng format dưới dạng JSON như sau: 
        {
          "intent": "product_detail",
          "response": "<p>Đây là sản phẩm giày thể thao sneaker của trang web chúng tôi,...!</p>",
          "auto_redirect": true,
          "redirect_url": "${DOMAIN}/shop/slug-product"
        };
      `;
    const response = yield chat.sendMessage({
        message: prompt,
    });
    const output = response.text.slice(response.text.indexOf("{"), response.text.lastIndexOf("}") + 1);
    const data = JSON.parse(output);
    res.json({
        code: 200,
        message: "Chatbot response",
        data: {
            intent: intent,
            response: data.response,
            auto_redirect: data.auto_redirect || false,
            redirect_url: data.redirect_url || "https://shop.kakrist.site/shop",
        },
    });
});
const promptProduct = (req_1, res_1, input_1, chat_1, intent_1, ...args_1) => __awaiter(void 0, [req_1, res_1, input_1, chat_1, intent_1, ...args_1], void 0, function* (req, res, input, chat, intent, products = []) {
    const prompt = `Đây là danh sách sản phẩm dưới dạng JSON sau khi phân tích yêu cầu của người dùng "${input}": ${JSON.stringify(products)}, 
        - Hãy trả lời một cách tự nhiên và thân thiện, vui vẻ, trò chuyện với người dùng và cung cấp thông tin về sản phẩm này nhé.
        - Dựa vào lịch sử trò chuyện + các input đã có của người dùng, hãy trả lời sao cho phù hợp, nối tiếp cuộc trò chuyện, ví dụ "tôi muốn một chiếc áo", input sau có thể là "Thêm màu đỏ", và có thể tiếp là: "Thêm kích thước L", và cũng có thể là "sản phẩm tương tự".
        - Hãy linh hoạt trong việc chọn ngôn ngữ, nhưng ưu tiên Tiếng việt.
        - Dựa vào input khi người dùng muốn tìm sản phẩm tương tự, hãy trả lời sao cho hợp lý với sản phẩm đã tìm kiếm, ví dụ: "Đây là những sản phẩm tương tự với sản phẩm bạn đã đề cập".
        - Nếu là câu hỏi đầu tiên thì hãy bắt đầu với xin chào còn không thì không cần xin chào.
        - Nếu không có sản phẩm nào phù hợp hãy trả lời khéo và nói rằng không tìm thấy sản phẩm nào phù hợp với yêu cầu của người dùng.
        - Với response hãy trả về dưới dạng thẻ HTML, ví dụ: <p>Đây là sản phẩm phù hợp với yêu cầu của bạn, chúc bạn tìm được sản phẩm ưng ý nhé!</p>
        - Hãy nhớ tên các sản phẩm trong danh sách sản phẩm trên, để phục vụ việc trả lời của bạn, nếu có sản phẩm tên giống nhau hãy nhớ thứ tự của chúng và hỏi rõ lại người dùng muốn hỏi sản phẩm nào.
        - Hãy nhớ rằng các sản phẩm có thể sẽ không đúng như input, hãy trả lời thêm rằng đó là những sản phẩm có thể bạn thích hoặc tương tự.
        Yêu cầu trả lời đúng format dưới dạng JSON như sau: 
        {
          "intent": "search_product",
          "response": "<p>Đây là sản phẩm phù hợp với yêu cầu của bạn, chúc bạn tìm được sản phẩm ưng ý nhé!</p>",
          "data": [danh sách sản phẩm]
        }
        ;
      `;
    const response = yield chat.sendMessage({
        message: prompt,
    });
    const output = response.text.slice(response.text.indexOf("{"), response.text.lastIndexOf("}") + 1);
    const data = JSON.parse(output);
    res.json({
        code: 200,
        message: "Chatbot response",
        data: {
            intent: intent,
            response: data.response,
            data: products,
        },
    });
});
const promptBlog = (req, res, input, chat, intent) => __awaiter(void 0, void 0, void 0, function* () {
    const blogs = yield getBlogs(input);
    const prompt = `Đây là danh sách blog dưới dạng JSON sau khi phân tích yêu cầu của người dùng "${input}": ${JSON.stringify(blogs)}, 
      Dữ liệu tham khảo thêm: 
      - Đây là domain của trang web: ${DOMAIN}
      - Link chi tiết blog (nếu cần): ${DOMAIN}/blogs/slug-blog


      Yêu cầu:
        - Hãy trả lời một cách tự nhiên và thân thiện, vui vẻ, trò chuyện với người dùng và cung cấp thông tin về những bài viết này nhé.
        - Hãy linh hoạt trong việc chọn ngôn ngữ, nhưng ưu tiên Tiếng việt.
        - Hạn chế việc sử dụng từ "Xin chào" trong câu trả lời, chỉ sử dụng khi người dùng hỏi về sức khỏe hoặc muốn bắt đầu cuộc trò chuyện.
        - Nếu không có blog nào phù hợp hãy trả lời khéo và nói rằng không tìm thấy blog nào phù hợp với yêu cầu của người dùng.
        - Với response hãy trả về dưới dạng thẻ HTML, ví dụ: <p>Đây là blog phù hợp với yêu cầu của bạn, chúc bạn tìm được blog ưng ý nhé!</p>
        - Hãy nhớ 1 vài thông tin các blog trong danh sách blog trên, để phục vụ việc trả lời của bạn, nếu có blog tên giống nhau hãy nhớ thứ tự của chúng và hỏi rõ lại người dùng muốn hỏi blog nào.
        - Nếu dung thẻ a, hãy thêm 1 chút css.
        Yêu cầu trả lời đúng format dưới dạng JSON như sau: 
        {
          "intent": "search_blog",
          "response": "<p>Đây là blog phù hợp với yêu cầu của bạn, chúc bạn tìm được blog hay và ưng ý nhé!</p>",
          "data": [danh sách blog]
        }
        ;
      `;
    const response = yield chat.sendMessage({
        message: prompt,
    });
    const output = response.text.slice(response.text.indexOf("{"), response.text.lastIndexOf("}") + 1);
    const data = JSON.parse(output);
    res.json({
        code: 200,
        message: "Chatbot response",
        data: {
            intent: intent,
            response: data.response,
            data: blogs,
        },
    });
});
const getBlogs = (input) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const blogs = yield blog_model_1.default.find({ deleted: false, status: "published" }, { tags: 1, title: 1 });
        const tags = Array.from(new Set(blogs.flatMap((blog) => blog.tags))).join(", ");
        const title = blogs.map((blog) => blog.title).join(", ");
        const prompt = `Bạn là một trợ lý ảo của một trang web bán hàng, nhiệm vụ của bạn là phân tích yêu cầu của người dùng và xuất ra dữ liệu có cấu trúc dạng JSON theo mẫu bên dưới. Không cần giải thích gì thêm.

    Người dùng hỏi: "${input}"

    Dữ liệu tham khảo:
    - Danh sách tags (dạng: tên): ${tags}
    - Danh sách tiêu đề bài viết cho việc dễ match (dạng: tên): ${title}

    Yêu cầu:
    - Hãy nhớ là đang tìm kiếm bài viết phù hợp với yêu cầu của người dùng.
    - Trích xuất tiêu đề bài viết với một vài từ khóa chính với danh sách title đã cho.
    - Nếu có tên tags sản phẩm phù hợp, trả về mảng 'tags' là danh sách tags tương ứng

    Kết quả trả về chỉ là JSON theo mẫu sau:
    {
      "title": "...",
      "tags": ["tag1", "tag2"]
    }
    `;
        const response = yield gemAI.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
        });
        const output = response.text.slice(response.text.indexOf("{"), response.text.lastIndexOf("}") + 1);
        const object = JSON.parse(output);
        let find = {
            deleted: false,
            status: "published",
        };
        if (object.title) {
            find.$text = { $search: object.title };
        }
        if (object.tags && object.tags.length > 0) {
            find.tags = { $in: object.tags };
        }
        const blogsFound = yield blog_model_1.default.find(find).limit(5).lean();
        const author_ids = blogsFound.map((blog) => blog.user_id);
        const authors = yield user_model_1.default.find({
            _id: { $in: author_ids },
            deleted: false,
        }).select("fullName avatar _id email");
        const blogsWithAuthor = blogsFound.map((blog) => {
            const author = authors.find((a) => a._id.toString() === blog.user_id);
            return Object.assign(Object.assign({}, blog), { author: author
                    ? { name: author.fullName, avatar: author.avatar }
                    : null });
        });
        console.log(find);
        return blogsWithAuthor;
    }
    catch (error) {
        console.error("Error products:", error);
        throw error;
    }
});
const getProductsWithFields = (input, req) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        let [categoriesMap] = yield getCategoriesAndOptions();
        const prompt = `Bạn là một trợ lý ảo của một trang web bán hàng, nhiệm vụ của bạn là phân tích yêu cầu của người dùng và xuất ra dữ liệu có cấu trúc dạng JSON theo mẫu bên dưới. Không cần giải thích gì thêm.

    Người dùng hỏi: "${input}"

    Dữ liệu tham khảo:
    - Danh sách danh mục (dạng: tên:danh_mục_id): ${categoriesMap}

    Yêu cầu:
    - Nếu có nói về mức giá, hãy lấy giá trung bình (price), cùng với khoảng min_price và max_price dao động ±10%
    - Nếu có tên danh mục sản phẩm phù hợp, trả về mảng 'categories' là danh sách '_id' tương ứng
    - Trường 'productType' là "variations" nếu có biến thể, "simple" nếu không, biến thể là các tùy chọn như màu sắc, kích thước.. (nếu có).

    Kết quả trả về chỉ là JSON theo mẫu sau:

    {
      "price": "100",
      "min_price": "95",
      "max_price": "105",
      "categories": ["id1", "id2"],
      "productType": "simple",
    }
    hoặc
    {
      "price": "100",
      "min_price": "95",
      "max_price": "105",
      "categories": ["id1", "id2"],
      "productType": "variations",
    }
   
    `;
        const response = yield gemAI.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
        });
        const output = response.text.slice(response.text.indexOf("{"), response.text.lastIndexOf("}") + 1);
        const object = JSON.parse(output);
        return yield getProducts(input, object, req);
    }
    catch (error) {
        console.error("Error products:", error);
        throw error;
    }
});
const getProducts = (input, object, req) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const response = yield gemAI.models.embedContent({
            model: "gemini-embedding-001",
            contents: input,
            config: {
                outputDimensionality: 1536,
            },
        });
        const qdrantClient = (0, database_1.getQdrantClient)();
        const filter = {};
        if ((object === null || object === void 0 ? void 0 : object.categories) && object.categories.length > 0) {
            filter["must"] = [
                { key: "categories", match: { any: object.categories } },
            ];
        }
        if ((object === null || object === void 0 ? void 0 : object.minPrice) && (object === null || object === void 0 ? void 0 : object.maxPrice)) {
            const min_price = Number(object.minPrice);
            const max_price = Number(object.maxPrice);
            filter["must"] = [
                ...filter["must"],
                {
                    should: [
                        {
                            key: "price",
                            range: {
                                gte: min_price,
                                lte: max_price,
                            },
                        },
                        {
                            must: [
                                { key: "min_price", range: { gte: min_price } },
                                { key: "max_price", range: { lte: max_price } },
                            ],
                        },
                    ],
                },
            ];
        }
        console.log(filter);
        const vector = response.embeddings[0].values;
        const newInput = (0, convertInput_1.convertInput)(input, 2);
        const hash = crypto_1.default.createHash("sha256").update(newInput).digest("hex");
        if ((object === null || object === void 0 ? void 0 : object.productType) === "variations") {
            const products = yield qdrantClient.search("sub-products", {
                vector,
                filter,
                limit: 5,
            });
            const points = products.map((item) => item.id);
            req.session["userState"] = {
                lastIntent: "search_product",
                lastQuery: Object.assign(Object.assign({}, object), { points }),
            };
            yield cachedHelper(points, {
                collection_name: "sub-products",
                intent: "search_product",
            }, "", hash, newInput);
            return products.map((item) => (Object.assign(Object.assign({}, item.payload), { productType: "variations" })));
        }
        const products = yield qdrantClient.search("products", {
            vector,
            filter,
            limit: 5,
        });
        const points = products.map((item) => item.id);
        req.session["userState"] = {
            lastIntent: "search_product",
            lastQuery: Object.assign(Object.assign({}, object), { points }),
        };
        yield cachedHelper(points, {
            collection_name: "products",
            intent: "search_product",
        }, "", hash, newInput);
        return products.map((item) => item.payload);
    }
    catch (error) {
        console.error("Error products:", error);
        throw error;
    }
});
const getCategoriesAndOptions = () => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const categories = yield category_model_1.default.find({ deleted: false })
            .select("title")
            .lean();
        const categoriesMap = categories
            .map((cat) => {
            return `${cat.title}:${String(cat._id)}`;
        })
            .join(", ");
        const variations = yield variation_model_1.default.find({ deleted: false })
            .select("title _id")
            .lean();
        const variationIds = variations.map((variation) => variation._id.toString());
        const variationOptions = yield variationOption_model_1.default.find({
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
        return [categoriesMap, optionsMap];
    }
    catch (error) {
        console.error("Error getting categories and options:", error);
        throw error;
    }
});
const getProductUsingInput = (input) => __awaiter(void 0, void 0, void 0, function* () {
    const existSlug = input.includes("mã") || input.includes("slug") || input.includes("id");
    let product = null;
    if (existSlug) {
        let slug = input.substring(input.indexOf("mã") + 2).trim();
        slug = slug.replace(/["']/g, "");
        if (slug) {
            product = yield product_model_1.default.findOne({ slug }).lean();
        }
    }
    if (product && product.productType === "variations") {
        const [subProducts, supplier] = yield Promise.all([
            subProduct_model_1.default.find({ product_id: product._id, deleted: false }).lean(),
            supplier_model_1.default.findOne({ _id: product.supplier_id }).lean(),
        ]);
        if (subProducts && subProducts.length > 0) {
            (0, product_1.solvePriceStock)(product, subProducts);
        }
        if (supplier) {
            product.supplierName = supplier.name;
        }
    }
    return product;
});
const formattedChatHelper = (chatHistory) => {
    const formattedChat = chatHistory.slice(2).map((msg) => {
        const message = msg.parts[0].text;
        if (msg.role === "user") {
            return {
                role: "user",
                content: message.slice(message.indexOf('"') + 1, message.indexOf('"', message.indexOf('"') + 1)),
            };
        }
        const indexIntent = message.indexOf("intent");
        if (indexIntent !== -1) {
            const mess = message.slice(message.indexOf("{"), message.lastIndexOf("}") + 1);
            const inObj = JSON.parse(mess);
            return {
                role: msg.role,
                intent: inObj.intent,
                content: inObj.response || "No response",
                data: inObj.data || [],
            };
        }
        return {
            role: msg.role,
            intent: "small_talk",
            content: message,
        };
    });
    return formattedChat;
};
const promptGuideWebsite = (req, res, input, chat) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const publicRoute = [
            "/",
            "/shop",
            "/blogs",
            "/contact",
            "/stories",
            "/auth/login",
            "/auth/register",
            "/search",
        ];
        const privateRoute = [
            "/cart",
            "/cart/checkout",
            "/profile",
            "/profile/wishlists",
            "/profile/address",
            "/profile/notifications",
            "/profile/orders",
            "/profile/settings",
            "/profile/blog-saved",
        ];
        const prompt = `Bạn là một trợ lý ảo của trang web bán hàng, nhiệm vụ của bạn là hướng dẫn người dùng cách sử dụng trang web này.
    - Người dùng hỏi: "${input}"
    - Đây là domain của trang web: ${DOMAIN}
    - Danh sách các đường dẫn công khai: ${publicRoute.join(", ")}
    - Danh sách các đường dẫn riêng tư: ${privateRoute.join(", ")}
    - Các mục cá nhân hóa ở route "/profile", cài đặt như chỉnh thông báo, theme, ngôn ngữ ở route "/profile/settings"
    - Để check user login hay chưa hãy sử dụng userId: ${req.userId}, nếu trống thì là chưa login, ngược lại là đã login.
    - Hãy nhớ rằng bạn chỉ xuất hiện ở trang chủ ("/"), các trang khác tôi chưa có update để bạn có thể xuất hiện, nên bạn hãy hướng dẫn thân thiện và tự nhiên nhé.
    - Hãy linh hoạt trong việc chọn ngôn ngữ, nhưng ưu tiên Tiếng việt.

    Yêu cầu:
    - Phân tích yêu cầu của người dùng và cung cấp hướng dẫn chi tiết về cách sử dụng trang web.
    - Đảm bảo rằng các đường dẫn được đề cập ở trên được sử dụng đúng cách trong hướng dẫn.
    - Nếu người dùng hỏi về các route private, hãy check xem đã login hay chưa, nếu chưa thì hãy trả lời rằng bạn cần đăng nhập để sử dụng các chức năng này.
    - Đừng cố gắng đề cập đến các route private nếu người dùng chưa đăng nhập, hãy hướng dẫn họ đăng nhập trước.
    - Response của bạn nên bao gồm các thẻ HTML để định dạng văn bản, ví dụ: <p>Hướng dẫn sử dụng trang web...</p>.
    - Hãy mô tả đường dẫn như 1 breedcrumb, ví dụ: "Để truy cập trang chủ, bạn có thể vào <a href='${DOMAIN}'>Trang chủ</a> hoặc để xem sản phẩm, hãy vào <a href='${DOMAIN}/shop'>Cửa hàng</a>."
    - Hỏi xem người dùng có muốn tự động chuyển hướng đến trang chủ không, nếu có hãy trả về thêm trường "auto_redirect": true, và "redirect_url": "${DOMAIN}/something-url", tôi sẽ tự re-direct người dùng đến trang đó.
    - Nhớ là hỏi trước ý định của người dùng có muốn tự động chuyển hướng hay không, nếu có thì mới trả về trường auto_redirect và redirect_url.
    - Nếu người dùng nhắn thẳng, khẳng định muốn tự động chuyển hướng luôn mà chưa cần hỏi thì hãy trả về trường auto_redirect là true và redirect_url là đường dẫn mà bạn muốn chuyển hướng.
    - Nếu người dùng xác nhận muốn tự động chuyển hướng thì hãy mô phỏng delay 3 giây (css cho spin, hoặc bạn có thể làm gì đó) để tôi có thể tự động chuyển hướng.
    - Nếu dùng thẻ a, hãy thêm một chút css cho nó.
    - Trả lời dưới dạng JSON với cấu trúc như sau:
    {
      "intent": "guide_website",
      "response": "<p>Hướng dẫn sử dụng trang web...</p>"
      "auto_redirect": false,
      "redirect_url": "${DOMAIN}/profile/settings"
    }
    `;
        const response = yield chat.sendMessage({
            message: prompt,
        });
        const output = response.text.slice(response.text.indexOf("{"), response.text.lastIndexOf("}") + 1);
        const data = JSON.parse(output);
        res.json({
            code: 200,
            message: "Chatbot response",
            data: {
                intent: data.intent || "guide_website",
                response: data.response,
                auto_redirect: data.auto_redirect || false,
                redirect_url: data.redirect_url || `${DOMAIN}`,
            },
        });
    }
    catch (error) {
        console.error("Error in promptGuideWebsite:", error);
        throw error;
    }
});
const messageTalk = (input, chat) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const prompt = `Bạn là một trợ lý ảo của một trang web bán hàng và là một người bạn siêu hiểu biết, hãy trả lời một cách tự nhiên và thân thiện, vui vẻ, trò chuyện với người dùng. 
    - Người dùng gửi câu sau "${input}"

    - Yêu cầu: 
    - Trả message về dưới dạng thẻ HTML, ví dụ: <p>Tôi khỏe, còn bạn</p>.
    - Hãy hạn chế sử dụng từ "Xin chào" trong câu trả lời, chỉ sử dụng khi người dùng hỏi về sức khỏe hoặc muốn bắt đầu cuộc trò chuyện.
    - Nếu người dùng muốn trò chuyện, hãy hỗ trợ họ một cách tự nhiên và thân thiện.
    - Hãy linh hoạt trong việc trả lời, không cần phải quá nghiêm túc, hãy tạo cảm giác thoải mái cho người dùng.
    - Hãy linh hoạt trong việc chọn ngôn ngữ, nhưng ưu tiên Tiếng việt.
    - Trả kết quả dưới dạng JSON như sau:
    {
      "intent": "small_talk",
      "response": "<p>Tôi khỏe, còn bạn</p>"
    }

    `;
        const response = yield chat.sendMessage({
            message: prompt,
        });
        const output = response.text.slice(response.text.indexOf("{"), response.text.lastIndexOf("}") + 1);
        return JSON.parse(output).response;
    }
    catch (error) {
        console.error("Error occurred while talking message:", error);
        throw error;
    }
});
const createOrGetChatHistory = (map, sessionId) => __awaiter(void 0, void 0, void 0, function* () {
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
            setTimeout(() => {
                map.delete(sessionId);
            }, 1000 * 60 * 60 * 24);
        }
        return map.get(sessionId);
    }
    catch (error) {
        console.error("Error creating or getting chat history:", error);
        throw error;
    }
});
const getProductWithVectorIds = (vector_ids_1, ...args_1) => __awaiter(void 0, [vector_ids_1, ...args_1], void 0, function* (vector_ids, collection_name = "products") {
    try {
        const qdrantClient = (0, database_1.getQdrantClient)();
        const products = yield qdrantClient.retrieve(collection_name, {
            ids: vector_ids,
            with_payload: true,
            with_vector: false,
        });
        return products.map((item) => (Object.assign(Object.assign({}, item.payload), { productType: collection_name === "products" ? "simple" : "variations" })));
    }
    catch (error) {
        console.error("Error getting products with vector IDs:", error);
        throw error;
    }
});
const cachedHelper = (points_1, ...args_1) => __awaiter(void 0, [points_1, ...args_1], void 0, function* (points, query = {}, input, text_hash, text) {
    try {
        if (input) {
            const newInput = (0, convertInput_1.convertInput)(input, 2);
            const hash = crypto_1.default.createHash("sha256").update(newInput).digest("hex");
            yield textCache_model_1.default.insertOne({
                text_hash: hash,
                text: newInput,
                response: points,
                query: query,
            });
            return;
        }
        yield textCache_model_1.default.insertOne({
            text_hash: text_hash,
            text: text,
            response: points,
            query: query,
        });
    }
    catch (error) {
        throw error;
    }
});
const checkCaching = (input) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const newInput = (0, convertInput_1.convertInput)(input, 2);
        const cached = yield textCache_model_1.default.findOne({
            text_hash: crypto_1.default.createHash("sha256").update(newInput).digest("hex"),
        }).lean();
        return cached;
    }
    catch (error) {
        throw error;
    }
});
