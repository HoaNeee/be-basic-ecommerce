import * as mongoose from "mongoose";

export const connect = async (): Promise<void> => {
  try {
    await mongoose.connect(process.env.MONGO_URL);
    console.log("connect to mongodb success");
  } catch (error) {
    console.log("connect to mongodb failed " + error);
  }
};
