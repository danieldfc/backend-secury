const mongoose = require("../../database");

const Occurrence = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      lowercase: true,
      unique: true
    },
    description: {
      type: String,
      required: true
    },
    assigneTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    completed: {
      type: Boolean,
      required: true,
      default: false
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model("Occurrence", Occurrence);
