import jwt from "jsonwebtoken";
import { JWT_SECRET_KEY } from "../../../config/config.service.js";

export const generateToken = ({ payload, option = {} } = {}) =>{
    return jwt.sign(payload, JWT_SECRET_KEY, option);
}

export const verifyToken = ({ token, option = {} } = {}) =>
  jwt.verify(token, JWT_SECRET_KEY, option);
