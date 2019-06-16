const express = require("express");
const bodyParser = require("body-parser");
const morgan = require("morgan");
const cors = require("cors");
const exphbs = require("express-handlebars");

const app = express();
app.use(cors());

app.engine("handlebars", exphbs({ defaultLayout: "main" }));
app.set("view engine", "handlebars");

const server = require("http").createServer(app);
const io = require("socket.io")(server);

require("./database");

app.use((req, res, next) => {
  req.io = io;

  next();
});

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(morgan("dev"));

require("./app/controllers/index")(app);

server.listen(process.env.PORT || 3333);
