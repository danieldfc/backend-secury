const express = require("express");

const UserController = require("./UserController");
const PoliceController = require("./PoliceController");

const router = express.Router();

router.post("/register/police", PoliceController.store);
router.post("/register/user", UserController.store);

router.post("/authenticate/police", PoliceController.auth);
router.post("/authenticate/user", UserController.auth);

router.post("/forgot_password/police", PoliceController.forgot_password);
router.post("/forgot_password/user", UserController.forgot_password);

router.post("/reset_password/police", PoliceController.reset_password);
router.post("/reset_password/user", UserController.reset_password);

module.exports = app => app.use("/auth", router);
