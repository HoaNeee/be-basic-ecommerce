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
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploads = exports.upload = void 0;
const uploadCloud_1 = require("../../../helpers/uploadCloud");
const upload = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { buffer } = req.file;
        const result = yield (0, uploadCloud_1.uploadCloud)(buffer);
        res.json({
            code: 200,
            message: "OK",
            data: result.url,
        });
    }
    catch (error) {
        console.log(error.message);
        res.json({
            code: 500,
            message: error.message,
        });
    }
});
exports.upload = upload;
const uploads = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const files = req.files;
        const length = files.length;
        const arr = [];
        for (let i = 0; i < Number(length); i++) {
            arr.push(files[i]);
        }
        const response = yield Promise.all(arr.map((file) => __awaiter(void 0, void 0, void 0, function* () {
            return yield (0, uploadCloud_1.uploadCloud)(file.buffer);
        })));
        const data = response.map((file) => file.url);
        res.json({
            code: 200,
            message: "OK",
            data: data,
        });
    }
    catch (error) {
        console.log(error.message);
        res.json({
            code: 500,
            message: error.message,
        });
    }
});
exports.uploads = uploads;
