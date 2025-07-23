"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.number = exports.string = void 0;
const string = (length) => {
    const patten = "qwertyuiopasdfghjklzxcvbnmQWERTYUIOPLKJHGFDSAZXCVBNM0123456789";
    let out = "";
    for (let i = 0; i < length; i++) {
        const idx = Math.floor(Math.random() * patten.length);
        out += patten[idx];
    }
    return out;
};
exports.string = string;
const number = (length) => {
    const patten = "0123456789";
    let out = "";
    for (let i = 0; i < length; i++) {
        const idx = Math.floor(Math.random() * patten.length);
        out += patten[idx];
    }
    return out;
};
exports.number = number;
