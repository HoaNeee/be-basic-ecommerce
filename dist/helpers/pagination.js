"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Pagination = (objectInitial, query, totalRecord) => {
    const objectPagination = Object.assign({}, objectInitial);
    objectPagination.totalPage = Math.ceil(totalRecord / objectPagination.limitItems);
    let page = Number(query.page) || 1;
    objectPagination.currentPage = page;
    objectPagination.skip = Math.max(0, (page - 1) * objectPagination.limitItems);
    return objectPagination;
};
exports.default = Pagination;
