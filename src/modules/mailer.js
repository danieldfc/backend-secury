const nodemailer = require("nodemailer");
const hbs = require("nodemailer-express-handlebars");
const path = require("path");

const { host, port, user, pass } = require("../config/mail.json");

var transport = nodemailer.createTransport({
  host,
  port,
  auth: { user, pass }
});

const handleOtions = {
  viewEngine: {
    defaultLayout: "handlebars",
    layoutDir: path.resolve("./src/resources/mail/"),
    partialsDir: path.resolve("./src/resources/mail/")
  },
  viewPath: path.resolve("./src/resources/mail"),
  extName: ".html"
};

transport.use("compile", hbs(handleOtions));

module.exports = transport;
