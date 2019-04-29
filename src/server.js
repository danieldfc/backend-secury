const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const exphbs = require("express-handlebars");

const app = express();
app.use(cors());

app.engine("handlebars", exphbs({ defaultLayout: "main" }));
app.set("view engine", "handlebars");

const server = require("http").Server(app);
const io = require("socket.io")(server);

io.on("connection", socket => {
  socket.on("connectRoom", box => {
    socket.join(box);
  });
});

app.set("views", "");

require("./database");

app.use((req, res, next) => {
  req.io = io;
  return next();
});

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

require("./app/controllers/index")(app);

server.listen(process.env.PORT || 3333);
