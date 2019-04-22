const mongoose = require("mongoose");
const config = require("../config");

mongoose.connect(config.url, {
  useNewUrlParser: true,
  useCreateIndex: true,
  useFindAndModify: false
});

module.exports = mongoose;
