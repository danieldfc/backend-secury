const express = require("express");
const bcrypt = require("bcryptjs");
const authMiddleware = require("../middleware/auth");

const Task = require("../models/Task");
const User = require("../models/User");
const Police = require("../models/Police");
const io = require("socket.io");

const router = express.Router();

router.use(authMiddleware);

router.post("/list", async (req, res) => {
  try {
    const tasks = await Task.find().populate("assignedTo");

    if (!tasks) {
      return res.status(404).send({ error: "Error loading tasks" });
    }

    return res.status(202).send({ tasks });
  } catch (err) {
    return res.status(400).send({ error: "Error loading tasks" });
  }
});

// Criar tarefa
router.post("/", async (req, res) => {
  try {
    const { email, occurrence } = req.body;

    const user = await User.findByIdAndUpdate(
      req.userId,
      { email },
      { new: true }
    )
      .select("+password occurrence")
      .populate("Task");

    console.log(user);

    if (!user) {
      return res.status(400).send({ error: "User not found" });
    }

    await Promise.all(
      occurrence.map(async task => {
        const userTask = new Task({ ...task, assignedTo: user._id });

        await userTask.save();

        user.occurrence.push(userTask);
        req.io.sockets.in(user._id).emit("taskCreate", task);
      })
    );

    await user.save();
    user.password = undefined;

    return res.status(200).send({ user });
  } catch (err) {
    console.log(err);
    return res.status(400).send({ error: "Error creating task of user" });
  }
});

// Listar a tarefa com informações do usuário
router.post("/:id", async (req, res) => {
  try {
    const task = await Task.findById(req.params.id).populate("assignedTo");

    return res.status(200).send({ task });
  } catch (err) {
    return res.status(400).send({ error: "Error loading occurrence" });
  }
});

// atualizar task
router.put("/:id", async (req, res) => {
  try {
    const { email, password, location, occurrence } = req.body;

    const user = await User.findByIdAndUpdate(
      req.params.id,
      {
        email,
        password,
        location
      },
      { new: true }
    ).select("+password");

    user.occurrence = [];
    await Task.deleteOne({ assignedTo: user._id });

    await Promise.all(
      occurrence.map(async task => {
        const userTask = new Task({ ...task, assignedTo: user._id });

        await userTask.save();

        user.occurrence.push(userTask);
        req.io.sockets.in(user._id).emit("taskUpdate", task);
      })
    );

    await user.save();
    user.password = undefined;

    return res.status(200).send({ user });
  } catch (err) {
    console.log(err);
    return res.status(400).send({ error: "Error updating task" });
  }
});

// Deletar uma task
router.delete("/:id", async (req, res) => {
  try {
    await Task.findByIdAndRemove(req.params.id);

    return res.status(200).send({ message: "Task remove with success." });
  } catch (err) {
    return res.status(400).send({ error: "Error deleting occurrence" });
  }
});

module.exports = app => app.use("/task", router);
