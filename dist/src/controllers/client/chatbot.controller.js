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
exports.chatBot = exports.getHistoryChat = void 0;
const genai_1 = require("@google/genai");
const category_model_1 = __importDefault(require("../../models/category.model"));
const variation_model_1 = __importDefault(require("../../models/variation.model"));
const variationOption_model_1 = __importDefault(require("../../models/variationOption.model"));
const product_model_1 = __importDefault(require("../../models/product.model"));
const subProduct_model_1 = __importDefault(require("../../models/subProduct.model"));
const subProductOption_model_1 = __importDefault(require("../../models/subProductOption.model"));
const groupBy_1 = require("../../../helpers/groupBy");
const blog_model_1 = __importDefault(require("../../models/blog.model"));
const user_model_1 = __importDefault(require("../../models/user.model"));
const API_KEY = process.env.GOOGLE_GEM_AI_API_KEY;
const DOMAIN = process.env.NODE_ENV === "production"
    ? "https://shop.kakrist.site"
    : "http://localhost:3000";
const gemAI = new genai_1.GoogleGenAI({ apiKey: API_KEY });
const chatHistory = new Map();
const getHistoryChat = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const chat = ((_a = chatHistory.get(req.session["sid"])) === null || _a === void 0 ? void 0 : _a.history) || [];
        const formattedChat = formattedChatHelper(chat);
        res.json({
            code: 200,
            message: "Success",
            data: formattedChat,
            chatNotFormat: chat,
        });
    }
    catch (error) {
        res.json({ code: 500, message: "Internal Server Error: " + error.message });
    }
});
exports.getHistoryChat = getHistoryChat;
const chatBot = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
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
        const { intent } = yield getIntent(input, req);
        console.log("intent", intent);
        switch (intent) {
            case "search_product":
                return yield promptProduct(req, res, input, chat, intent);
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
                res.json({
                    code: 400,
                    message: "Intent not recognized",
                });
                return;
        }
    }
    catch (error) {
        res.json({ code: 500, message: "Internal Server Error: " + error.message });
    }
});
exports.chatBot = chatBot;
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
const getIntent = (input, req) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const chat = ((_a = chatHistory.get(req.session["sid"])) === null || _a === void 0 ? void 0 : _a.history) || [];
        const formattedChat = formattedChatHelper(chat);
        const classicPrompt = `Bạn là một trợ lý ảo của một trang web bán hàng, người dùng gửi câu sau "${input}"
      Hãy dựa vào lịch sử trò chuyện sau: ${JSON.stringify(formattedChat)}
      
      Xác định intent và trả về 'intent' chính xác nhất trong số các intent sau:
      - "search_product": Tìm kiếm sản phẩm
      - "product_detail": Chi tiết sản phẩm
      - "small_talk": Nói chuyện nhỏ
      - "search_blog": Tìm kiếm bài viết
      - "guide_website": Hướng dẫn sử dụng website, ví dụ như: đi tới trang sản phẩm, trang giỏ hàng, trang thanh toán, trang đăng nhập, trang đăng ký, trang chi tiết sản phẩm, "tôi muốn biết trang đơn hàng của tôi ở đâu, tôi muốn biết chỉnh theme thế nào"
      Chỉ trả về dạng JSON: { "intent": "..." }
    `;
        const response = yield gemAI.models.generateContent({
            model: "gemini-2.5-flash",
            contents: classicPrompt,
        });
        const output = response.text.slice(response.text.indexOf("{"), response.text.lastIndexOf("}") + 1);
        return JSON.parse(output);
    }
    catch (error) {
        console.error("Error occurred while getting intent:", error);
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
    - Hãy linh hoạt trong việc chọn ngôn ngữ, nhưng ưu tiên Tiếng việt nhé.
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
const promptProductDetail = (req, res, input, chat, intent) => __awaiter(void 0, void 0, void 0, function* () {
    const prompt = `Bạn là một trợ lý ảo của trang web, dựa vào lịch sử trò chuyện cho việc thông tin chi tiết sản phẩm, hãy trả lời một cách tự nhiên và thân thiện, vui vẻ, trò chuyện với người dùng.
        - Người dùng gửi câu sau "${input}"
        Yêu cầu:
        - Hãy linh hoạt trong việc chọn ngôn ngữ, nhưng ưu tiên Tiếng việt nhé.
        - Hỏi xem người dùng có muốn qua trang chi tiết sản phẩm không.
        - Bạn có thể đưa link chi tiết sản phẩm vào (nếu sử dụng thẻ a, hãy css cho nó đặc biệt chút), đây là domain của trang web: ${DOMAIN}, link chi tiết sản phẩm là: ${DOMAIN}/shop/slug-product
        - Hỏi xem người dùng có muốn tự động chuyển hướng đến trang chi tiết sản phẩm không, nếu có hãy trả về thêm trường "auto_redirect": true, và "redirect_url": "${DOMAIN}/shop/slug-product", tôi sẽ tự re-direct người dùng đến trang chi tiết sản phẩm.
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
const promptProduct = (req, res, input, chat, intent) => __awaiter(void 0, void 0, void 0, function* () {
    const products = yield getProducts(input);
    const prompt = `Đây là danh sách sản phẩm dưới dạng JSON sau khi phân tích yêu cầu của người dùng "${input}": ${JSON.stringify(products)}, 
        - Hãy trả lời một cách tự nhiên và thân thiện, vui vẻ, trò chuyện với người dùng và cung cấp thông tin về sản phẩm này nhé.
        - Hãy linh hoạt trong việc chọn ngôn ngữ, nhưng ưu tiên Tiếng việt.
        - Nếu là câu hỏi đầu tiên thì hãy bắt đầu với xin chào còn không thì không cần xin chào.
        - Nếu không có sản phẩm nào phù hợp hãy trả lời khéo và nói rằng không tìm thấy sản phẩm nào phù hợp với yêu cầu của người dùng.
        - Với response hãy trả về dưới dạng thẻ HTML, ví dụ: <p>Đây là sản phẩm phù hợp với yêu cầu của bạn, chúc bạn tìm được sản phẩm ưng ý nhé!</p>
        - Hãy nhớ tên các sản phẩm trong danh sách sản phẩm trên, để phục vụ việc trả lời của bạn, nếu có sản phẩm tên giống nhau hãy nhớ thứ tự của chúng và hỏi rõ lại người dùng muốn hỏi sản phẩm nào.
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

    Yêu cầu:
    - Hãy linh hoạt trong việc chọn ngôn ngữ, nhưng ưu tiên Tiếng việt.
    - Phân tích yêu cầu của người dùng và cung cấp hướng dẫn chi tiết về cách sử dụng trang web.
    - Đảm bảo rằng các đường dẫn được đề cập ở trên được sử dụng đúng cách trong hướng dẫn.
    - Nếu người dùng hỏi về các route private, hãy check xem đã login hay chưa, nếu chưa thì hãy trả lời rằng bạn cần đăng nhập để sử dụng các chức năng này.
    - Response của bạn nên bao gồm các thẻ HTML để định dạng văn bản, ví dụ: <p>Hướng dẫn sử dụng trang web...</p>.
    - Hãy mô tả đường dẫn như 1 breedcrumb, ví dụ: "Để truy cập trang chủ, bạn có thể vào <a href='${DOMAIN}'>Trang chủ</a> hoặc để xem sản phẩm, hãy vào <a href='${DOMAIN}/shop'>Cửa hàng</a>."
    - Hỏi xem người dùng có muốn tự động chuyển hướng đến trang chủ không, nếu có hãy trả về thêm trường "auto_redirect": true, và "redirect_url": "${DOMAIN}/something-url", tôi sẽ tự re-direct người dùng đến trang đó.
    - Nhớ là hỏi trước ý định của người dùng có muốn tự động chuyển hướng hay không, nếu có thì mới trả về trường auto_redirect và redirect_url.
    - Nếu người dùng nhắn thẳng, khẳng định muốn tự động chuyển hướng luôn mà chưa cần hỏi thì hãy trả về trường auto_redirect là true và redirect_url là đường dẫn mà bạn muốn chuyển hướng.
    - Nếu người dùng xác nhận muốn tự động chuyển hướng thì hãy mô phỏng delay 3 giây (css cho spin, hoặc bạn có thể làm gì đó) để tôi có thể tự động chuyển hướng.
    - Nếu dùng thẻ a, hãy css cho nó đặc biệt chút để người dùng dễ nhận biết.
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
const getProducts = (input) => __awaiter(void 0, void 0, void 0, function* () {
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
        const response = yield gemAI.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
        });
        const output = response.text.slice(response.text.indexOf("{"), response.text.lastIndexOf("}") + 1);
        const object = JSON.parse(output);
        let find = {
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
            const products = yield handleProductSimple(find);
            return products;
        }
        find.productType = "variations";
        const products = yield handleProductVariations(find, object);
        return products;
    }
    catch (error) {
        console.error("Error products:", error);
        throw error;
    }
});
const handleProductSimple = (find) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        console.log("find", find);
        const products = yield product_model_1.default.aggregate([
            { $match: find },
            {
                $addFields: {
                    product_id_string: { $toString: "$_id" },
                },
            },
            {
                $lookup: {
                    from: "sub-products",
                    localField: "product_id_string",
                    foreignField: "product_id",
                    as: "subProducts",
                    pipeline: [
                        { $match: { deleted: false } },
                        {
                            $project: {
                                price: 1,
                            },
                        },
                    ],
                },
            },
            {
                $set: {
                    rangePrice: {
                        min: { $min: "$subProducts.price" },
                        max: { $max: "$subProducts.price" },
                    },
                },
            },
            { $limit: 5 },
        ]);
        return products;
    }
    catch (error) {
        console.error("Error simple product:", error);
        throw error;
    }
});
const handleProductVariations = (find, object) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        delete find.$or;
        console.log(find);
        const variation_options = object.variation_options || [];
        const products = yield product_model_1.default.find(find);
        const productIds = products.map((product) => product._id.toString());
        let findSub = {
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
        const subProducts = yield subProduct_model_1.default.find(findSub).lean();
        const subIds = subProducts.map((sub) => sub._id.toString());
        const [subOptions, options] = yield Promise.all([
            subProductOption_model_1.default.find({
                sub_product_id: { $in: subIds },
                variation_option_id: { $in: variation_options },
                deleted: false,
            }),
            variationOption_model_1.default.find({
                _id: { $in: variation_options },
                deleted: false,
            }),
        ]);
        const subOptionsMap = (0, groupBy_1.groupByArray)(subOptions, "sub_product_id");
        const response = [];
        for (const sub of subProducts) {
            if (subOptionsMap.get(sub._id.toString())) {
                const opts = subOptionsMap.get(sub._id.toString());
                sub["options"] = [];
                for (const opt of opts) {
                    const optionObject = options.find((o) => o._id.toString() === opt.variation_option_id.toString());
                    if (optionObject) {
                        sub["options"].push(optionObject);
                    }
                }
                const product = products.find((p) => p._id.toString() === sub.product_id.toString());
                sub["slug"] = product ? product.slug : "";
                sub["thumbnail_product"] = product ? product.thumbnail : "";
                sub["title"] = product ? product.title : "";
                response.push(sub);
            }
        }
        return response.slice(0, 5);
    }
    catch (error) {
        console.error("Error variations product:", error);
        throw error;
    }
});
