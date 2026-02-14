import jwt from "jsonwebtoken";

export const generateToken = ({ payload, option = {} } = {}) =>{
    return jwt.sign(payload, process.env.JWT_SECRET_KEY, option);
}

export const verifyToken = ({ token, option = {} } = {}) =>
  jwt.verify(token, process.env.JWT_SECRET_KEY, option);
