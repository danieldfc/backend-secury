const nodemailer = require("nodemailer");
const hbs = require("nodemailer-express-handlebars");
const path = require("path");

const { host, port, user, pass } = require("../config/mail.json");

const transport = nodemailer.createTransport({
  host,
  port,
  auth: { user, pass }
});

transport.use("compile", hbs(options));

const handleOtions = {
  viewEngine: {
    defaultLayout: "handlebars",
    layoutDir: path.resolve("./src/resources/mail/"),
    partialsDir: { dir: path.resolve("./src/resources/mail/") }
  },
  viewPath: path.resolve("./src/resources/mail"),
  extName: ".html"
};

transport.use("compile", hbs(handleOtions));

module.exports = transport;
