export const groupByArray = (data: any[], key: string) => {
  const map = new Map();

  for (const item of data) {
    if (map.has(item[key])) {
      const arr = map.get(item[key]);
      arr.push(item);
      map.set(item[key], [...arr]);
    } else map.set(item[key], [item]);
  }
  return map;
};
