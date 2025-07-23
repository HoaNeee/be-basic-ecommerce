interface ObjectPagination {
  page: number; //init
  limitItems: number;
  totalPage?: number;
  currentPage?: number;
  skip?: number;
}

const Pagination = (
  objectInitial: ObjectPagination,
  query: Record<string, any>,
  totalRecord: number
): ObjectPagination => {
  const objectPagination: ObjectPagination = {
    ...objectInitial,
  };

  objectPagination.totalPage = Math.ceil(
    totalRecord / objectPagination.limitItems
  );

  let page = Number(query.page) || 1;
  objectPagination.currentPage = page;
  objectPagination.skip = Math.max(0, (page - 1) * objectPagination.limitItems);

  return objectPagination;
};

export default Pagination;
