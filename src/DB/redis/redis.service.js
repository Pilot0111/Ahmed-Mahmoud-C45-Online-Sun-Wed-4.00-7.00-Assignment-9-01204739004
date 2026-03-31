import { redisClient } from "./redis.db.js";

export const generateOtpKey = (email) => `otp::confirmEmail::${email}`;
export const max_Otp_tries = (email) => `otp::${email}::MaxOtptries`;
export const block_key_otp = (email) => `otp::${email}::block`;

export const max_login_tries = (email) => `login::${email}::MaxLoginTries`;
export const block_key_login = (email) => `login::${email}::block`;

export const generate2SVOtpKey = (email) => `otp::2sv::${email}`;
export const generateForgetPasswordOtpKey = (email) => `otp::forgetPassword::${email}`;
export const generateRevokeTokenKey = (userId, jti) => jti ? `revokeToken::${userId}::${jti}` : `revokeToken::${userId}`;
export const generateProfileKey = (userId) => `profile::${userId}`;

export const setValue = async ({ key, value, ttl } = {}) => {
  try {
    const data = typeof value === "string" ? value : JSON.stringify(value);
    return ttl
      ? await redisClient.set(key, data, { EX: ttl })
      : await redisClient.set(key, data);
  } catch (error) {
    console.log("Redis set failed!", error);
  }
};

export const updateValue = async ({ key, value, ttl } = {}) => {
  try {
    if (! await redisClient.exists(key)) return 0; 
    return await setValue({ key, value, ttl });
  } catch (error) {
    console.log("Redis set failed!", error);
  }
};

export const get = async ({ key } = {}) => {
  try {
    try {
      return JSON.parse(await redisClient.get(key));
    } catch (error) {
      return await redisClient.get(key);
    }
  } catch (error) {
    console.log("Redis get failed!", error);
  }
};

export const multiGet = async (keys) => {
  try {
    return await redisClient.mGet(keys);
  } catch (error) {
    console.log("Redis mGet failed!", error);
  }
};

export const ttl = async (key) => {
  try {
    return await redisClient.ttl(key);
  } catch (error) {
    console.log("Redis ttl failed!", error);
  }
};


export const exists = async (key) => {
  try {
    return await redisClient.exists(key);
  } catch (error) {
    console.log("Redis exists failed!", error);
  }
};

export const deleteKey = async (key) => {
  try {
    if (!key.length || !key) return 0;
    return await redisClient.del(key);
  } catch (error) {
    console.log("Redis del failed!", error);
  }
};

export const keys = async (pattern) => {
  try {
    return await redisClient.keys(`${pattern}*`);
  } catch (error) {
    console.log("Redis keys failed!", error);
  }
};

export const expire = async ({  key, ttl } = {}) => {
  try {
    return await redisClient.expire(key, ttl);
  } catch (error) {
    console.log("Redis expire failed!", error);
  }
};

export const increment = async (key) => {
  try {
    return await redisClient.incr(key);
  } catch (error) {
    console.log("Redis incr failed!", error);
  }
};