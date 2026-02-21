export const validation = (schema) => {
    
  return (req, res, next) => {
    let errorResult = [];
    for (const key of Object.keys(schema)) {
      const result = schema[key].validate(req[key], { abortEarly: false });
      if (result.error) {
        errorResult.push(result.error);
      }
      
    }
     if (errorResult.length > 0) {
        res.status(400).json({ message: "Validation error", error: errorResult });
        return;
      }
    next();
  };
};
