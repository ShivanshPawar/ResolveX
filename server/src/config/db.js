import mongoose from "mongoose";

export async function connectDb(mongodbUri) {
  await mongoose.connect(mongodbUri, {
    autoIndex: true,
  });
}
