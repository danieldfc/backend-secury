const bcrypt = require("bcryptjs");
const crypto = require("crypto");

const User = require("../models/User");
const mailer = require("../../modules/mailer");
const config = require("../../config/auth.json");

function generateToken(params = {}) {
  return jwt.sign(params, config.secret, {
    expiresIn: 86400
  });
}

class UserController {
  async store(req, res) {
    const { email } = req.body;
    try {
      if (await User.findOne({ email })) {
        return res.status(400).send({ error: "User already exists" });
      }

      const user = await User.create(req.body);
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

  async auth(req, res) {
    const { email, password, token } = req.body;

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
  async forgot_password(req, res) {
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
  async reset_password(req, res) {
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
}

module.exports = new UserController();
