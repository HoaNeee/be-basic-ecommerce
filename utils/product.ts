export const solvePriceStock = async (product: any, subProducts: any) => {
  let min = Infinity,
    max = 0,
    stock = 0;
  for (const sub of subProducts) {
    stock += sub.stock;
    min = Math.min(min, sub.price);
    max = Math.max(max, sub.price);
  }
  product[`rangePrice`] = {
    min: min,
    max: max,
  };
  product[`rangeStock`] = stock;
};
