import mongoose from "mongoose";
import { MONGODB_URI_ONLINE } from "../config/config.service.js";

const checkConnection = async () => {
  try {
    await mongoose.connect(MONGODB_URI_ONLINE, {
      serverSelectionTimeoutMS: 5000,
    });
    // await mongoose.connection.dropDatabase();
    console.log(`Database connected successfully! to ${MONGODB_URI_ONLINE} 😘😘`);
  } catch (error) {
    console.log(error);
  }
};

export default checkConnection;
