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
exports.aiAssistantProduct = exports.aiAssistantBlog = void 0;
const genai_1 = require("@google/genai");
const blog_model_1 = __importDefault(require("../../models/blog.model"));
const category_model_1 = __importDefault(require("../../models/category.model"));
const variation_model_1 = __importDefault(require("../../models/variation.model"));
const variationOption_model_1 = __importDefault(require("../../models/variationOption.model"));
const supplier_model_1 = __importDefault(require("../../models/supplier.model"));
const API_KEY = process.env.GOOGLE_GEM_AI_API_KEY;
const DOMAIN = process.env.NODE_ENV === "production"
    ? "https://shop.kakrist.site"
    : "http://localhost:3000";
const gemAI = new genai_1.GoogleGenAI({ apiKey: API_KEY });
const aiAssistantBlog = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { input } = req.body;
        const blogs = yield blog_model_1.default.find({ deleted: false }, { tags: 1 });
        const tags = Array.from(new Set(blogs.flatMap((blog) => blog.tags)));
        const prompt = `Bạn là một trợ lý ảo của một trang web (thời trang) dành cho admin, nhiệm vụ của bạn là tạo nội dung blog dựa trên các từ khóa được cung cấp.
    
    Dưới đây là các từ khóa: "${input}". 

    - Dữ liệu tham khảo:
      + Đây là các tags có sẵn có thể sử dụng trong bài viết: ${tags.join(", ")}.

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
        const response = yield gemAI.models.generateContent({
            model: "gemini-2.0-flash",
            contents: prompt,
        });
        const data = response.text.slice(response.text.indexOf("{"), response.text.lastIndexOf("}") + 1);
        res.status(200).json({
            code: 200,
            message: "AI Assistant response",
            data: JSON.parse(data),
        });
    }
    catch (error) {
        console.error("Error in AI Assistant:", error);
        res.status(500).json({
            code: 500,
            message: "Internal server error",
        });
    }
});
exports.aiAssistantBlog = aiAssistantBlog;
const aiAssistantProduct = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { input } = req.body;
        console.log(input);
        const suppliers = yield supplier_model_1.default.find({ deleted: false }).select("name id");
        const suppliersMap = suppliers.map((supplier) => {
            return `${supplier.id}:${supplier.name}`;
        });
        const categories = yield category_model_1.default.find({ deleted: false }).select("title id");
        const categoriesMap = categories
            .map((cat) => {
            return `${cat.id}:${cat.title}`;
        })
            .join(", ");
        const variations = yield variation_model_1.default.find({ deleted: false }).select("title id");
        const variationMap = variations
            .map((variation) => {
            return `${variation.id}:${variation.title}`;
        })
            .join(", ");
        const variation_ids = variations.map((variation) => variation.id);
        const options = yield variationOption_model_1.default.find({
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
      + Đây là các nhà cung cấp có sẵn có thể sử dụng trong sản phẩm: ${suppliersMap.join(", ")}.

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
      "SKU": "Mã SKU của sản phẩm, ví dụ: 'SKU-1234'",
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
        const response = yield gemAI.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
        });
        const data = response.text.slice(response.text.indexOf("{"), response.text.lastIndexOf("}") + 1);
        res.status(200).json({
            code: 200,
            message: "AI Assistant response",
            data: JSON.parse(data),
        });
    }
    catch (error) {
        console.error("Error in AI Assistant:", error);
        res.status(500).json({
            code: 500,
            message: "Internal server error",
        });
    }
});
exports.aiAssistantProduct = aiAssistantProduct;
