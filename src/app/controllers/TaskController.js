const express = require("express");
const authMiddleware = require("../middleware/auth");

const Task = require("../models/Task");
const User = require("../models/User");
const Police = require("../models/Police");

const router = express.Router();

router.use(authMiddleware);

// Criar tarefa
router.post("/", async (req, res) => {
  try {
    const { email, occurrence } = req.body;

    const user = await User.findByIdAndUpdate(
      req.userId,
      { email },
      { new: true }
    )
      .select("+password")
      .populate("occurrence");

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
    return res.status(400).send({ error: "Error creating task of user" });
  }
});

// listar as tasks não completadas
router.post("/list", async (req, res) => {
  try {
    const tasks = await Task.find({ completed: false });
    const police = await Police.findById(req.userId);

    if (!police && !tasks) {
      return res.status(404).send({ error: "Error loading tasks" });
    }

    return res.status(202).send({ tasks });
  } catch (err) {
    return res.status(400).send({ error: "Error loading tasks" });
  }
});

// listar as tasks de usuário, usando id do usuário
router.post("/list/:id", async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .select("+password")
      .populate("occurrence");

    return res.status(200).send({ tasks: user.occurrence });
  } catch (err) {
    return res.status(400).send({ error: "error" });
  }
});

// Ao policial clicar no botão "Aceitar" no front-end
router.post("/:id", async (req, res) => {
  try {
    const task = await Task.findById(req.params.id)
    .select("+assignedTo")
    .populate("assignedTo");

    if (!task) return res.status(404).send({ error: "Task not found!" });

    const police = await Police.findById(req.userId).select(
      "+password cpf assignedTo"
    );

    if (police.assignedTo == undefined) {
      await Police.findByIdAndUpdate(police._id, {
        $set: {
          assignedTo: task._id
        }
      });
    } else {
      return res.status(303).send({ error: "Police ocupado" });
    }
    await task.save();
    await police.save();
    police.password = undefined;

    req.io.sockets.in(police._id).emit("taskUpdate", task);
    return res.status(200).send({ task });
  } catch (err) {
    return res.status(400).send({ error: "Error loading task" });
  }
});

// completed Task of user with the Police
router.post("/completed/:id", async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);

    if (!task) return res.status(404).send({ error: "Task not found!" });

    const police = await Police.findById(req.userId, { new: true }).select(
      "+password cpf assignedTo"
    );

    if (police.assignedTo == task.id) {
      await Police.findByIdAndUpdate(police._id, {
        $set: {
          assignedTo: null
        }
      });
      await Task.findByIdAndRemove(task._id);
      const userTask = await Task.find({ assignedTo: task._id }).select(
        "+description title"
      );
      await User.findByIdAndUpdate(task.assignedTo, {
        $set: {
          occurrence: userTask
        }
      });
    } else {
      return res
        .status(403)
        .send({ error: "Police não pegou nenhuma ocorrência." });
    }
    await task.save();
    await police.save();

    police.password = undefined;
    police.cpf = undefined;

    req.io.sockets.in(police._id).emit("taskUpdate", task);
    return res.status(200).send({ police });
  } catch (err) {
    return res.status(400).send({ error: "Erro completed task" });
  }
});

// atualizar task
router.put("/:id", async (req, res) => {
  try {
    const { title, description } = req.body;
    const reqTasks = await Task.findByIdAndUpdate(
      req.params.id,
      { title, description },
      {
        new: true
      }
    );

    return res.status(200).send({ task: reqTasks });
  } catch (err) {
    return res.status(400).send({ error: "Error updating task" });
  }
});

// Deletar uma task(Perfect)
router.delete("/:id", async (req, res) => {
  try {
    const reqTasks = await Task.findByIdAndRemove(req.params.id, {
      assignedTo: req.userId
    }).select("+description title");

    if (!reqTasks) return res.status(503).send({ error: "The Task no exist!" });

    const user = await User.findByIdAndUpdate(req.userId, {
      $set: {
        occurrence: reqTasks
      }
    })
      .select("+password")
      .populate("occurrence");

    user.password = undefined;

    return res.status(200).send({ occurrence: user.occurrence });
  } catch (err) {
    return res.status(400).send({ error: "Error deleting occurrence" });
  }
});

module.exports = app => app.use("/task", router);
