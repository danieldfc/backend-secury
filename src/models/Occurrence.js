const mongoose = require("mongoose");

const Occurrence = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      lowercase: true,
      unique: true
    },
    users: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    },
    description: {
      type: String,
      required: true,
      lowercase: true
    },
    type_Occurrence: {
      type: String,
      required: true,
      lowercase: true
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model("Occurrence", Occurrence);
