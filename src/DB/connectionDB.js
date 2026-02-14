import mongoose from "mongoose"


const checkConnection = async () => {
    try {
        await mongoose.connect("mongodb://localhost:27017/SarahaApp", {
           serverSelectionTimeoutMS: 5000
        });
        console.log("Database connected successfully! 😘😘");
    } catch (error) {
        console.log(error); 
    }
}

export default checkConnection;