const express = require("express");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");
//const mailer = require("../../modules/mailer");
//const emailService = require("../../services/email-services");

const User = require("../models/User");
const config = require("../../config/auth.json");

const router = express.Router();

function generateToken(params = {}) {
  return jwt.sign(params, config.secret, {
    expiresIn: 86400
  });
}

router.post("/register", async (req, res) => {
  const { email } = req.body;
  try {
    if (await User.findOne({ email })) {
      return res.status(400).send({ error: "User already exists" });
    }

    const user = await User.create(req.body);

    //await emailService.send(req.body.email, "Bem vindo ao Node Store", {
    //  email: config.email_tmpl.replace("{0}", req.body.email)
    //});

    user.password = undefined;

    return res.send({
      user,
      token: generateToken({ id: user.id })
    });
  } catch (err) {
    return res.status(400).send({ error: "Registration Failed" });
  }
});

router.post("/authenticate", async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email }).select("+password");

  if (!user) {
    return res.status(400).send({ error: "User not found" });
  }
  if (!(await bcrypt.compare(password, user.password))) {
    return res.status(400).send({ error: "Invalid password" });
  }

  //await emailService.send(
  //  req.body.email,
  //  "Autenticado",
  //  config.email_tmpl.replace("{0}", req.body.email)
  //);

  user.password = undefined;

  res.send({
    user,
    token: generateToken({ id: user.id })
  });
});

router.post("/forgot_password", async (req, res) => {
  const { email } = req.body;

  try {
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(400).send({ error: "User not found" });
    }

    const token = crypto.randomBytes(20).toString("hex");

    const now = new Date();
    now.setHours(now.getHours() + 1);

    await User.findByIdAndUpdate(user.id, {
      $set: {
        passwordResetToken: token,
        passwordResetExpires: now
      }
    });

    emailService.send(
      {
        from: "daniel.david772@gmail.com",
        to: email,
        template: "/auth/forgot_password",
        context: { token, email }
      },
      err => {
        if (err) {
          return res
            .status(400)
            .send({ error: "Cannot send forgot password email" });
        }
        return res.send("Email send");
      }
    );
  } catch (err) {
    return res
      .status(400)
      .send({ error: "Error on forgot password. try again" });
  }
});

router.post("/reset_password", async (req, res) => {
  const { email, token, password } = req.body;

  try {
    const user = await User.findOne({ email }).select(
      "+passwordResetToken passwordResetExpires"
    );
    if (!user) {
      return res.status(400).send({ error: "User not found" });
    }
    if (token !== user.passwordResetToken) {
      return res.status(400).send({ error: "Token invalid" });
    }
    const now = new Date();
    now.setHours(now.getHours() + 1);

    if (now > user.passwordResetExpires) {
      return res
        .status(400)
        .send({ error: "Token Expired, generate a new one" });
    }
    user.password = password;

    await user.save();

    res.send();
  } catch (err) {
    return res.status(400).send({ error: "Cannot set password, try again" });
  }
});

module.exports = app => app.use("/auth", router);
