import express from "express";
import checkConnection from "./DB/connectionDB.js";
import userRouter from "./modules/user/user.controller.js";
const app = express();
const port = 3000;

const bootsrap = async (req, res) => {
  app.use(express.json());
  app.get("/", (req, res) => {res.status(200).json("Welome to Saraha App!")});



checkConnection();  

app.use("/users", userRouter)



  app.use("{/*demo}", (req, res, next) => {
throw new Error(`route ${req.originalUrl} not found`,{cause:404});    
  });

  app.use((err, req, res, next) => {
    res.status( err.cause ||500).json({ message: "something went wrong", error: err.message, stack: err.stack });
  });

  app.listen(port, () => {
    console.log(`Example app listening at http://localhost:${port}`);
  });
};

export default bootsrap;
