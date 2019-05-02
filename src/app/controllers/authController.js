const express = require("express");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");

const Police = require("../models/Police");
const User = require("../models/User");
const mailer = require("../../modules/mailer");
const config = require("../../config/auth.json");

function generateToken(params = {}) {
  return jwt.sign(params, config.secret, {
    expiresIn: 86400
  });
}

const router = express.Router();

router.post("/register", async (req, res) => {
  const { usuario, isPolice, data } = req.body;
  if (isPolice === true) {
    try {
      const { email } = req.body;
      if (await Police.findOne({ email })) {
        return res.status(400).send({ error: "Police already exists" });
      }
      const police = await Police.create({ ...data, email });
      police.password = undefined;
      police.cpf = undefined;

      mailer.sendMail(
        {
          from: "suporte.security@gmail.com",
          to: email,
          subject: "Welcome",
          template: "/auth/police/welcome",
          context: { email }
        },
        err => {
          if (err) {
            return res
              .status(400)
              .send({ error: "Cannot send forgot password email" });
          }
        }
      );
      return res.send({
        police,
        token: generateToken({ id: police.id })
      });
    } catch (err) {
      return res.status(400).send({ error: "Error creating new Police" });
    }
  } else if (isPolice === false) {
    const { email } = req.body;
    try {
      if (await User.findOne({ email })) {
        return res.status(400).send({ error: "User already exists" });
      }

      const user = await User.create(usuario);
      user.password = undefined;
      mailer.sendMail(
        {
          from: "suporte.security@gmail.com",
          to: email,
          subject: "Welcome",
          template: "/auth/user/welcome",
          context: { email }
        },
        err => {
          if (err) {
            return res
              .status(400)
              .send({ error: "Cannot send forgot password email" });
          }
        }
      );
      return res.send({
        user,
        token: generateToken({ id: user.id })
      });
    } catch (err) {
      return res.status(400).send({ error: "Error creating new User" });
    }
  }
});

router.post("/authenticate", async (req, res) => {
  const { isPolice, email, password, cpf, token } = req.body;
  if (isPolice === true) {
    try {
      const police = await Police.findOne({ email }).select("+password cpf");

      if (!user) {
        return res.status(400).send({ error: "User not found" });
      }
      if (!(await bcrypt.compare(password, police.password))) {
        return res.status(400).send({ error: "Invalid password" });
      }
      if (cpf !== police.cpf) {
        return res.status(400).send({ error: "Invalid cpf" });
      }

      mailer.sendMail(
        {
          from: "suporte.security@gmail.com",
          to: email,
          subject: "Authorization",
          template: "/auth/police/authorization",
          context: { email, token }
        },
        err => {
          if (err) {
            return res
              .status(400)
              .send({ error: "Cannot send forgot password email" });
          }
        }
      );

      police.password = undefined;
      police.cpf = undefined;

      return res.status(200).send({
        police,
        token: generateToken({ id: user.id })
      });
    } catch (err) {
      return res.status(400).send({ error: "Error authorization" });
    }
  } else if (isPolice === false) {
    const user = await User.findOne({ email }).select("+password");

    if (!user) {
      return res.status(400).send({ error: "User not found" });
    }
    if (!(await bcrypt.compare(password, user.password))) {
      return res.status(400).send({ error: "Invalid password" });
    }
    mailer.sendMail(
      {
        from: "suporte.security@gmail.com",
        to: email,
        subject: "Authorization",
        template: "/auth/user/authorization",
        context: { email, token }
      },
      err => {
        if (err) {
          return res
            .status(400)
            .send({ error: "Cannot send forgot password email" });
        }
      }
    );

    user.password = undefined;

    return res.status(200).send({
      user,
      token: generateToken({ id: user.id })
    });
  }
});

router.post("/forgot_password", async (req, res) => {
  const { isPolice, email, cpf } = req.body;
  if (isPolice === true) {
    try {
      const police = await Police.findOne({ email }).select("+cpf");

      if (!user) {
        return res.status(400).send({ error: "User not found" });
      }
      if (cpf !== police.cpf) {
        return res.status(400).send({ error: "Invalid cpf" });
      }

      const token = crypto.randomBytes(20).toString("hex");

      const now = new Date();
      now.setHours(now.getHours() + 1);

      await Police.findByIdAndUpdate(police.id, {
        $set: {
          passwordResetToken: token,
          passwordResetExpires: now
        }
      });

      mailer.sendMail(
        {
          from: "suporte.security@gmail.com",
          to: email,
          subject: "Forgot Password",
          template: "/auth/police/forgot_password",
          context: { email, cpf, token }
        },
        err => {
          if (err) {
            return res
              .status(400)
              .send({ error: "Cannot send forgot password email" });
          }
          return res.status(200).send({ police, message: "Email send" });
        }
      );
    } catch (err) {
      return res
        .status(400)
        .send({ error: "Error on forgot password. try again" });
    }
  } else if (isPolice === false) {
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

      mailer.sendMail(
        {
          from: "suporte.security@gmail.com",
          to: email,
          subject: "Forgot Password",
          template: "/auth/user/forgot_password",
          context: { email, token }
        },
        err => {
          if (err) {
            return res
              .status(400)
              .send({ error: "Cannot send forgot password email" });
          }
          return res.status(200).send({ user, message: "Email send" });
        }
      );
    } catch (err) {
      return res
        .status(400)
        .send({ error: "Error on forgot password. try again" });
    }
  }
});

router.post("/reset_password", async (req, res) => {
  const { isPolice, email, token, password, cpf } = req.body;
  if (isPolice === true) {
    try {
      const police = await Police.findOne({ email }).select(
        "+passwordResetToken passwordResetExpires"
      );
      if (!police) {
        return res.status(400).send({ error: "Police not found" });
      }

      if (cpf !== police.cpf) {
        return res.status(400).send({ error: "Invalid cpf" });
      }

      if (token !== police.passwordResetToken) {
        return res.status(400).send({ error: "Token invalid" });
      }

      const now = new Date();
      now.setHours(now.getHours() + 1);

      if (now > user.passwordResetExpires) {
        return res
          .status(400)
          .send({ error: "Token Expired, generate a new one" });
      }

      mailer.sendMail(
        {
          from: "suporte.security@gmail.com",
          to: email,
          subject: "Forgot Password",
          template: "/auth/reset_password",
          context: { email, password, cpf, token }
        },
        err => {
          if (err) {
            return res
              .status(400)
              .send({ error: "Cannot send forgot password email" });
          }
        }
      );

      police.password = password;

      await user.save();

      police.password = undefined;
      police.cpf = undefined;

      return res.status(200).send({ message: "Set password, success!" });
    } catch (err) {
      return res.status(400).send({ error: "Cannot set password, try again" });
    }
  } else if (isPolice === false) {
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

      mailer.sendMail(
        {
          from: "suporte.security@gmail.com",
          to: email,
          subject: "Forgot Password",
          template: "/auth/reset_password",
          context: { email, password, token }
        },
        err => {
          if (err) {
            return res
              .status(400)
              .send({ error: "Cannot send forgot password email" });
          }
          return res.status(200).send({ user, message: "Email send" });
        }
      );

      user.password = password;

      await user.save();

      res.send();
    } catch (err) {
      return res.status(400).send({ error: "Cannot set password, try again" });
    }
  }
});

module.exports = app => app.use("/auth", router);
