export const validation = (schema) => {
    
  return (req, res, next) => {
    let errorResult = [];
    for (const key of Object.keys(schema)) {
      const result = schema[key].validate(req[key], { abortEarly: false });
      // if (result.error) {
      //   errorResult.push(result.error);
      // }
      if(result.error)
      {
        result.error.details.forEach(element =>{
          errorResult.push({
            key,
            path: element.path[0],
            message: element.message
          })
        })
      }
    }
     if (errorResult.length > 0) {
        res.status(400).json({ message: "Validation error", error: errorResult });
        return;
      }
    next();
  };
};
