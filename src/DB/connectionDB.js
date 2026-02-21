import mongoose from "mongoose";

const checkConnection = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 5000,
    });
    console.log("Database connected successfully! 😘😘");
  } catch (error) {
    console.log(error);
  }
};

export default checkConnection;
