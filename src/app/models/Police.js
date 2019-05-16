const mongoose = require("../../database");
const bcrypt = require("bcryptjs");
const { validate } = require("gerador-validador-cpf");

const PoliceShema = new mongoose.Schema(
  {
    cpf: {
      type: String,
      required: true,
      select: false,
      unique: true
    },
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
      type: String
    },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    }
  },
  {
    timestamps: true
  }
);

PoliceShema.pre("save", async function(next) {
  await validate(this.cpf);
  const hash = await bcrypt.hash(this.password, 10);
  this.password = hash;
  next();
});

const Police = mongoose.model("Police", PoliceShema);

module.exports = Police;
