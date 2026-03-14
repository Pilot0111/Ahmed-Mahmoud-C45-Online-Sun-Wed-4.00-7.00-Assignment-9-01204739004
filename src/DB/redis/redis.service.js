import { redisClient } from "./redis.db.js";

export const setValue = async ({ key, value, ttl } = {}) => {
  try {
    const data = typeof value === "string" ? value : JSON.stringify(value);
    return ttl
      ? await redisClient.set(key, data, "EX", ttl)
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