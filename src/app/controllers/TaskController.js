const express = require("express");
const bcrypt = require("bcryptjs");
const authMiddleware = require("../middleware/auth");

const Task = require("../models/Task");
const User = require("../models/User");

const router = express.Router();

router.use(authMiddleware);

// Criar tarefa
router.post("/", async (req, res) => {
  try {
    const { email, password, occurrence } = req.body;

    const user = await User.findOne({ email })
      .select("+password")
      .populate("occurrence");

    if (!user) {
      return res.status(400).send({ error: "User not found" });
    }

    if (!(await bcrypt.compare(password, user.password))) {
      return res.status(400).send({ error: "Invalid password" });
    }

    await Promise.all(
      occurrence.map(async task => {
        const userTask = new Task({ ...task, assignedTo: user._id });

        await userTask.save();

        user.occurrence.push(userTask);
      })
    );

    await user.save();
    user.password = undefined;

    return res.status(200).send({ user });
  } catch (err) {
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

// Deletar um projeto
router.delete("/:id", async (req, res) => {
  try {
    await Task.findByIdAndRemove(req.params.id);

    return res.status(200).send({ message: "Task remove with success." });
  } catch (err) {
    return res.status(400).send({ error: "Error deleting occurrence" });
  }
});

module.exports = app => app.use("/task", router);
