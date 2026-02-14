import mongoose from "mongoose";
import { genderEnum, providerEnum } from "../../common/enums/user.enum.js";

const userSchema = new mongoose.Schema(
  {
    firstName: {
      type: String,
      required: true,
      minLength: 3,
      maxLength: 10,
      trim: true,
    },
    lastName: {
      type: String,
      required: true,
      minLength: 3,
      maxLength: 10,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true, 
      //lowercase: true,//
    },
    password: {
      type: String,
      required: true,
      trim: true,
      minLength: 6,
    },
    age: {
      type: Number,
    },
    gender: {
      type: String,
      enum: Object.values(genderEnum),
      default: genderEnum.male,
      required: true,
    },
    profilePicture: String,
    confirmed: Boolean,
    otp: String,// one time password for email verification
    provider : {
      type: String,
      enum: Object.values(providerEnum),
      default: providerEnum.system,
      required: true,
    },
    encryptionMode: {
      type: String,
      enum: ["symmetric", "asymmetric"],
      default: "symmetric",
    },
    phone: String

  },
  {
    timestamps: true,
    strictQuery: true, // this is to accept only the fields that are defined in the schema, its default value is false
    toJSON: {
      virtuals: true,
    },
    toObject: {
      virtuals: true,
    },
  },
);

userSchema.virtual("userName").get(function () {
  return `${this.firstName} ${this.lastName}`;
}).set(function (value) {
  const [firstName, lastName] = value.split(" ");
  this.set({firstName, lastName});
});


const userModel = mongoose.models.User || mongoose.model("User", userSchema);
export default userModel;
