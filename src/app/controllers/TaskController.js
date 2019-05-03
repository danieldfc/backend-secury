const express = require("express");
const bcrypt = require("bcryptjs");
const authMiddleware = require("../middleware/auth");

const Task = require("../models/Task");
const User = require("../models/User");
const Police = require("../models/Police");

const router = express.Router();

router.use(authMiddleware);

router.post("/list", async (req, res) => {
  const { isPolice, data, usuario } = req.body;

  if (isPolice === true) {
    try {
      const { email } = data;
      const police = await Police.findById(req.userId, { email }).select(
        "+cpf password occurrence"
      );

      if (!police) {
        return res.status(400).send({ error: "Error loading police!" });
      }

      const { occurrence } = police;

      await Promise.all(
        occurrence.map(async task => {
          const policeTask = Task({ ...task });

          await policeTask.save();

          police.occurrence.push(policeTask);
        })
      );

      return res.send({ tasks });
    } catch (err) {
      console.log(err);
      return res.status(400).send({ error: "Error loading tasks" });
    }
  } else if (isPolice === false) {
    try {
      const {} = usuario;
      const tasks = await Task.find();

      return res.send({ tasks });
    } catch (err) {
      return res.status(400).send({ error: "Error loading tasks" });
    }
  }
});

// Criar tarefa
router.post("/", async (req, res) => {
  const { isPolice, usuario, data } = req.body;
  if (isPolice === true) {
    try {
      const { email, cpf, password, occurrence } = data;

      const police = await Police.findByIdAndUpdate(
        req.userId,
        { email, cpf, password },
        { new: true }
      )
        .select("+cpf password occurrence")
        .populate("Task");

      if (!police) {
        return res.status(400).send({ error: "Police not found" });
      }

      await Promise.all(
        occurrence.map(async task => {
          const policeTask = new Task({ ...task, ofPolice: police._id });

          await policeTask.save();

          police.occurrence.push(policeTask);
        })
      );
      await police.save();
      police.password = undefined;

      return res.status(202).send({ police });
    } catch (err) {
      return res.status(400).send({ error: "Error creating task of police" });
    }
  } else if (isPolice === false) {
    try {
      const { email, password, occurrence } = usuario;

      const user = await User.findByIdAndUpdate(
        req.userId,
        { email, password },
        { new: true }
      )
        .select("+password occurrence")
        .populate("Task");

      if (!user) {
        return res.status(400).send({ error: "User not found" });
      }

      await Promise.all(
        occurrence.map(async task => {
          const userTask = new Task({ ...task, ofUser: user._id });

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
/*
como enviar socket.io para o client

async store(req, res) {
    console.log(req.file);
    const box = await Box.findById(req.params.id);

    const file = await File.create({
      title: req.file.originalname,
      path: req.file.key,
    });

    box.files.push(file);

    await box.save();

    req.io.sockets.in(box._id).emit('file', file);
    // Criar um arquivo
    return res.json(file);
  }
*/
