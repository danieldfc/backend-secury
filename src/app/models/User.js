const mongoose = require("../../database");
const bcrypt = require("bcryptjs");

const UserShema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      lowercase: true,
      unique: true
    },
    password: {
      type: String,
      required: true,
      select: false
    },
    passwordResetToken: {
      type: String,
      select: false
    },
    passwordResetExpires: {
      type: Date,
      select: false
    },
    location: {
      type: String,
      required: true
    },
    occurrence: []
  },
  {
    timestamps: true
  }
);

UserShema.pre("save", async function(next) {
  const hash = await bcrypt.hash(this.password, 10);
  this.password = hash;
  next();
});

const User = mongoose.model("User", UserShema);

module.exports = User;
