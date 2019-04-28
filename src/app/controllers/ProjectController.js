const express = require("express");
const authMiddleware = require("../middleware/auth");

const Project = require("../models/Projects");
const Task = require("../models/Task");

const router = express.Router();

router.use(authMiddleware);

// Criar projeto
router.post("/", async (req, res) => {
  try {
    const { title, description, tasks } = req.body;

    const project = await Project.create({
      title,
      description,
      user: req.userId
    });

    await Promise.all(
      tasks.map(async task => {
        const projectTask = new Task({ ...task, project: project._id });

        await project.save();

        project.tasks.push(projectTask);
      })
    );

    await project.save();

    return res.send({ project });
  } catch (err) {
    return res.status(400).send({ error: "Error creating new project" });
  }
});

// Listar projetos com informações do usuário
router.get("/", async (req, res) => {
  try {
    const project = await Project.find().populate(["user", "task"]);

    return res.send({ project });
  } catch (err) {
    return res.status(400).send({ error: "Error loading project" });
  }
});

// Procurar um projeto contendo informações do usuário
router.get("/:id", async (req, res) => {
  try {
    const occurrence = await Occurrence.findById(req.params.id).populate([
      "user",
      "task"
    ]);

    return res.send({ occurrence });
  } catch (err) {
    return res.status(400).send({ error: "Error creating loading occurrence" });
  }
});

// atualizar project
router.put("/:id", async (req, res) => {
  try {
    const { title, description, tasks } = req.body;

    const project = await Project.findByIdAndUpdate(req.params.id, {
      title,
      description
    });

    project.tasks = [];
    await Task.remove({ project: project._id });

    await Promise.all(
      tasks.map(async task => {
        const projectTask = new Task({ ...task, project: project._id });

        await project.save();

        project.tasks.push(projectTask);
      })
    );

    await project.save();

    return res.send({ project });
  } catch (err) {
    return res.status(400).send({ error: "Error creating new project" });
  }
});

// Deletar um projeto
router.delete("/:id", async (req, res) => {
  try {
    await Occurrence.findByIdAndRemove(req.params.id);

    return res.send();
  } catch (err) {
    return res.status(400).send({ error: "Error deleting occurrence" });
  }
});

module.exports = app => app.use("/projects", router);
