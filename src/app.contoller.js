import { PORT, WHITELIST } from "./config/config.service.js";
import express from "express";
import checkConnection from "./DB/connectionDB.js";
import userRouter from "./modules/user/user.controller.js";
const app = express();
const port = PORT;
import cors from "cors";
import { connectRedis, redisClient } from "./DB/redis/redis.db.js";
import { deleteUnconfirmedUsersCron } from "./common/utilites/cron/deleteUnconfirmed.cron.js";
import messageRouter from "./modules/message/message.controller.js";
import helmet from "helmet";
import {rateLimit} from "express-rate-limit"
const bootstrap = async () => {
  const corsOptions = {
    origin: function (origin, callback) {
      if ([...WHITELIST, undefined].includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
  };
  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: "Too many requests from this IP, please try again after 15 minutes",
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
    statusCode: 429,
    handler: (req, res, next) => {// this is will overide the message and status
      res.status(429).json({
        message: "Too many requests from this IP, please try again after 15 minutes",
      });
    },
    skipFailedRequests: false,
    skipSuccessfulRequests: false 
  });
  app.use(
    cors(corsOptions),
    helmet({
      contentSecurityPolicy: false,
      crossOriginEmbedderPolicy: false,// this is for csp 
      crossOriginResourcePolicy: false,//
    }),
    limiter,
    express.json(),
  );
  app.get("/", (req, res) => {
    res.status(200).json("Welcome to Saraha App!");
  });
  await checkConnection();
  await connectRedis();
  deleteUnconfirmedUsersCron();
  app.use("/uploads", express.static("uploads"));
  app.use("/users", userRouter);
  app.use("/messages", messageRouter);
  app.use((req, res, next) => {
    throw new Error(`route ${req.originalUrl} not found`, { cause: 404 });
  });

  app.use((err, req, res, next) => {
    res.status(err.cause || 500).json({ 
      message: "something went wrong",
      error: err.message,
      stack: err.stack,
    });
  });

  app.listen(port, () => {
    console.log(`Example app listening at http://localhost:${port}`);
  });
};

export default bootstrap;
