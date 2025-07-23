"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.groupByArray = void 0;
const groupByArray = (data, key) => {
    const map = new Map();
    for (const item of data) {
        if (map.has(item[key])) {
            const arr = map.get(item[key]);
            arr.push(item);
            map.set(item[key], [...arr]);
        }
        else
            map.set(item[key], [item]);
    }
    return map;
};
exports.groupByArray = groupByArray;
