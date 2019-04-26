const express = require("express");
const authMiddleware = require("../Milldleware/auth");

const Occurrence = require("../models/Occurrence");

const router = express.Router();

router.use(authMiddleware);

router.get("/", async (req, res) => {
  try {
    const occurrence = await Occurrence.find().populate("user");

    return res.send({ occurrence });
  } catch (err) {
    return res
      .status(400)
      .send({ error: "Error creating loading occurrences" });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const occurrence = await Occurrence.findById(req.params.id).populate(
      "user"
    );

    return res.send({ occurrence });
  } catch (err) {
    return res.status(400).send({ error: "Error creating loading occurrence" });
  }
});

router.post("/", async (req, res) => {
  try {
    const occurrence = await Occurrence.create({
      ...req.body,
      user: req.userId
    });
    return res.send({ occurrence });
  } catch (err) {
    return res.status(400).send({ error: "Error creating new occurrence" });
  }
});

router.put("/:id", async (req, res) => {
  res.send({ user: req.userId });
});

router.delete("/:id", async (req, res) => {
  try {
    await Occurrence.findByIdAndRemove(req.params.id);

    return res.send();
  } catch (err) {
    return res.status(400).send({ error: "Error deleting occurrence" });
  }
});

module.exports = app => app.use("/occurrence", router);
