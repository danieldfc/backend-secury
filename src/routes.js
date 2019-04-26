// Essa rota é para usuário básico
const express = require("express");

const routes = express.Router();

const UserController = require("./controllers/UserController");
const OccurrenceController = require("./controllers/OccurrenceController");

// GET(buscar) POST(criar) PUT(editar) DELETE(deletar)

// Users
// GET
routes.get("/user", UserController.all);
routes.get("/user/:id", UserController.show);
routes.get("/user/delete/:id", UserController.delete);
routes.get("/user/update/:id", UserController.update);

// POST
routes.post("/user/create", UserController.store);
routes.post("/user/:id/occurrence", UserController.store);

// Occurrence
// GET
routes.get("/admin/occurrence", OccurrenceController.all);
//routes.get("/occurrence/:id", OccurrenceController.show);
//routes.get("/occurrence/:id", OccurrenceController.);

//POST
//routes.post("/occurrence/create", OccurrenceController.store);

module.exports = routes;
