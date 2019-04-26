const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");

const routes = require("./routes");

const app = express();
app.use(cors());

const server = require("http").Server(app);
const io = require("socket.io")(server);

io.on("connection", socket => {
  socket.on("connectRoom", box => {
    socket.join(box);
  });
});

require("./database");

app.use((req, res, next) => {
  req.io = io;
  return next();
});

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(routes);

require("./app/controllers/index")(app);

server.listen(process.env.PORT || 3333);
