export const string = (length: number): string => {
  const patten =
    "qwertyuiopasdfghjklzxcvbnmQWERTYUIOPLKJHGFDSAZXCVBNM0123456789";
  let out = "";
  for (let i = 0; i < length; i++) {
    const idx = Math.floor(Math.random() * patten.length);
    out += patten[idx];
  }
  return out;
};

export const number = (length: number): string => {
  const patten = "0123456789";
  let out = "";
  for (let i = 0; i < length; i++) {
    const idx = Math.floor(Math.random() * patten.length);
    out += patten[idx];
  }
  return out;
};
