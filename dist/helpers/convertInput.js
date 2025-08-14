"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getWordsFilterInput = exports.convertInput = void 0;
const convertInput = (input, type = 1) => {
    function convert1(str) {
        return str
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .replace(/đ/g, "d")
            .replace(/Đ/g, "D")
            .replace(/\s+/g, " ")
            .trim()
            .toLowerCase();
    }
    function convert2(str) {
        return str
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .replace(/đ/g, "d")
            .replace(/Đ/g, "D")
            .replace(/[^a-zA-Z0-9\s]/g, "")
            .replace(/\s+/g, " ")
            .trim()
            .toLowerCase();
    }
    return type === 1 ? convert1(input) : convert2(input);
};
exports.convertInput = convertInput;
const getWordsFilterInput = ({ input, options, type, keys, }) => {
    const convertedKeyword = (0, exports.convertInput)(input);
    const wordProductsFilters = convertedKeyword.split(" ").map((w) => {
        return {
            [type || "$or"]: keys.map((item) => {
                return {
                    [item]: {
                        $regex: w,
                        $options: options,
                    },
                };
            }),
        };
    });
    return wordProductsFilters;
};
exports.getWordsFilterInput = getWordsFilterInput;
