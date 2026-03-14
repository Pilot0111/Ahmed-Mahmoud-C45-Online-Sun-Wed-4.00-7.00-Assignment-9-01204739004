import multer from "multer";
import fs from "node:fs";

export const multer_local = ({customPath="General", customType=[]}={}) => {
    const full_Path =`uploads/${customPath}`
    if (!fs.existsSync(full_Path)) {
      fs.mkdirSync(full_Path, { recursive: true });
    }


const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, full_Path);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + "_" + file.originalname);
  },
});

const fileFilter = (req, file, cb) => {
  if (customType.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Unsupported file format"), false);
  }
};

const upload = multer({ storage, fileFilter });

return upload;
}

export const multerErrorHandler = (multerMiddleware) => {
  return (req, res, next) => {
    multerMiddleware(req, res, (err) => {
      if (err) {
        if (err.code === "LIMIT_UNEXPECTED_FILE") {
          return next(
            new Error(
              `Upload failed: Too many files for field '${err.field}' or incorrect field name.`,
              { cause: 400 }
            )
          );
        }
        return next(new Error(err.message, { cause: 400 }));
      }
      next();
    });
  };
};

export const multer_memory = () => {

const storage = multer.memoryStorage();

const upload = multer({ storage });

return upload;
}

export const multer_Cloudinary = ({customType=[]}={}) => {
  const storage = multer.diskStorage({});

const fileFilter = (req, file, cb) => {
  if (customType.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Unsupported file format"), false);
  }
};

const upload = multer({ storage, fileFilter });

return upload;
}