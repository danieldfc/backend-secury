const mongoose = require("mongoose");
const config = require("../config");

mongoose.connect(config.url, {
  useMongoClient: true,
  useNewUrlParser: true,
  useCreateIndex: true,
  useFindAndModify: false
});
mongoose.Promise = global.Promise;

module.exports = mongoose;
