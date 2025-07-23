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
exports.changeStatus = exports.index = void 0;
const customer_model_1 = __importDefault(require("../../models/customer.model"));
const pagination_1 = __importDefault(require("../../../helpers/pagination"));
const index = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        let find = {
            deleted: false,
        };
        const status = req.query.status || "";
        const keyword = req.query.keyword || "";
        if (keyword) {
            find = Object.assign(Object.assign({}, find), { $or: [
                    { firstName: { $regex: keyword, $options: "si" } },
                    { lastName: { $regex: keyword, $options: "si" } },
                ] });
        }
        if (status) {
            find["status"] = status;
        }
        const totalRecord = yield customer_model_1.default.countDocuments(find);
        const initPagination = {
            page: 1,
            limitItems: totalRecord,
        };
        if (req.query.limit) {
            initPagination.limitItems = Number(req.query.limit);
        }
        const objPagination = (0, pagination_1.default)(initPagination, req.query, totalRecord);
        const customers = yield customer_model_1.default.find(find)
            .skip(objPagination.skip)
            .limit(objPagination.limitItems)
            .select("-password");
        res.json({
            code: 200,
            message: "OK",
            data: {
                customers,
                totalRecord,
            },
        });
    }
    catch (error) {
        console.log(error.message);
        res.json({
            code: 400,
            message: error.message,
        });
    }
});
exports.index = index;
const changeStatus = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const cus_id = req.params.id;
        if (!cus_id) {
            throw Error("Missing customer_id");
        }
        yield customer_model_1.default.updateOne({ _id: cus_id }, {
            status: req.body.status,
        });
        res.json({
            code: 200,
            message: "Update status success!",
        });
    }
    catch (error) {
        console.log(error.message);
        res.json({
            code: 400,
            message: error.message,
        });
    }
});
exports.changeStatus = changeStatus;
