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
exports.remove = exports.edit = exports.create = exports.addressDefault = exports.index = void 0;
const address_model_1 = __importDefault(require("../../models/address.model"));
const index = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const user_id = req.userId;
        const address = yield address_model_1.default.find({
            user_id: user_id,
            deleted: false,
        }).sort({ isDefault: -1 });
        res.json({
            code: 200,
            message: "OK",
            data: {
                address,
            },
        });
    }
    catch (error) {
        console.log(error);
        res.json({
            code: 400,
            message: error.message || error,
        });
    }
});
exports.index = index;
const addressDefault = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const user_id = req.userId;
        const address = yield address_model_1.default.findOne({
            user_id: user_id,
            deleted: false,
            isDefault: true,
        });
        res.json({
            code: 200,
            message: "OK",
            data: address,
        });
    }
    catch (error) {
        console.log(error);
        res.json({
            code: 400,
            message: error.message || error,
        });
    }
});
exports.addressDefault = addressDefault;
const create = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const user_id = req.userId;
        const body = req.body;
        const isDefault = body.isDefault;
        const newAddress = new address_model_1.default(Object.assign(Object.assign({}, body), { user_id: user_id }));
        if (isDefault) {
            const records = yield address_model_1.default.find({
                deleted: false,
                user_id: user_id,
                isDefault: true,
            });
            const ids = records.map((item) => item.id);
            yield address_model_1.default.updateMany({ _id: { $in: ids } }, { isDefault: false });
        }
        yield newAddress.save();
        res.json({
            code: 200,
            message: "Created!",
            data: newAddress,
        });
    }
    catch (error) {
        console.log(error);
        res.json({
            code: 400,
            message: error.message || error,
        });
    }
});
exports.create = create;
const edit = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const address_id = req.params.id;
        const user_id = req.userId;
        if (!address_id) {
            throw Error("Missing address_id");
        }
        const body = req.body;
        const isDefault = body.isDefault;
        const address = yield address_model_1.default.findOne({
            _id: address_id,
            user_id,
            deleted: false,
        });
        if (!address) {
            res.status(404).json({
                code: 404,
                message: "Address not found!",
            });
            return;
        }
        if (isDefault && !address.isDefault) {
            yield address_model_1.default.updateMany({ user_id: address.user_id, deleted: false }, { isDefault: false });
        }
        yield address_model_1.default.updateOne({ _id: address_id }, body);
        res.json({
            code: 200,
            message: "Updated!",
        });
    }
    catch (error) {
        console.log(error);
        res.json({
            code: 400,
            message: error.message || error,
        });
    }
});
exports.edit = edit;
const remove = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const address_id = req.params.id;
        const user_id = req.userId;
        if (!address_id) {
            throw Error("Missing address_id");
        }
        const address = yield address_model_1.default.findOne({
            _id: address_id,
            deleted: false,
        });
        if (!address) {
            res.status(404).json({
                code: 404,
                message: "Address not found!",
            });
            return;
        }
        if (address.user_id !== user_id) {
            res.status(403).json({
                code: 403,
                message: "Forbidden",
            });
            return;
        }
        if (address.isDefault) {
            yield address_model_1.default.deleteOne({ _id: address_id });
            const other = yield address_model_1.default.findOne({
                isDefault: false,
                _id: { $ne: address_id },
            });
            if (other) {
                other.isDefault = true;
                yield other.save();
            }
            res.json({
                code: 200,
                message: "Deleted!",
                data: other,
            });
            return;
        }
        yield address_model_1.default.deleteOne({ _id: address_id });
        res.json({
            code: 200,
            message: "Updated!",
        });
    }
    catch (error) {
        console.log(error);
        res.json({
            code: 400,
            message: error.message || error,
        });
    }
});
exports.remove = remove;
