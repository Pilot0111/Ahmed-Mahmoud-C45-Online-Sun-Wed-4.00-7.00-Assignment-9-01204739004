import mongoose from "mongoose";

const revokeTokenSchema = new mongoose.Schema(
  {
    tokenId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    expiresAt: {
      type: Date,
      required: true,
    },
    
  },
  { timestamps: true,
    strictQuery: true, // this is to accept only the fields that are defined in the schema, its default value is false
   }
);
revokeTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
const revokeTokenModel = mongoose.models.RevokeToken || mongoose.model("RevokeToken", revokeTokenSchema);
export default revokeTokenModel;