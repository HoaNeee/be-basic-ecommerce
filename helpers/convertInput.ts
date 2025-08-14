export const convertInput = (input: string, type: number = 1) => {
  function convert1(str: string): string {
    return str
      .normalize("NFD") // split characters with diacritics
      .replace(/[\u0300-\u036f]/g, "") // remove diacritics
      .replace(/đ/g, "d")
      .replace(/Đ/g, "D") // replace 'đ' with 'd' and 'Đ' with 'D'
      .replace(/\s+/g, " ") // replace multiple spaces with a single space
      .trim() // remove leading and trailing whitespace
      .toLowerCase(); // convert to lowercase
  }
  function convert2(str: string): string {
    return str
      .normalize("NFD") // split characters with diacritics
      .replace(/[\u0300-\u036f]/g, "") // remove diacritics
      .replace(/đ/g, "d")
      .replace(/Đ/g, "D") // replace 'đ' with 'd' and 'Đ' with 'D'
      .replace(/[^a-zA-Z0-9\s]/g, "") // remove special characters
      .replace(/\s+/g, " ") // replace multiple spaces with a single space
      .trim() // remove leading and trailing whitespace
      .toLowerCase(); // convert to lowercase
  }

  return type === 1 ? convert1(input) : convert2(input);
};

export const getWordsFilterInput = ({
  input,
  options,
  type,
  keys,
}: {
  input: string;
  options: string;
  type: "$or" | "$and";
  keys: string[];
}) => {
  const convertedKeyword = convertInput(input);
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
