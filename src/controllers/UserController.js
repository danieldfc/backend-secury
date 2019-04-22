const User = require("../models/User");

class UserController {
  async store(req, res) {
    const user = await User.create(req.body);

    return res.json(user);
  }

  async show(req, res) {
    try {
      const user = await User.findById(req.params.id);
      if (user) {
        return res.status(302).json(user);
      }
    } catch (err) {
      return res.status(404).send("Não encontrado");
    }
  }

  async all(req, res) {
    const user = await User.find();
    if (user.length) {
      return res.status(200).json(user);
    } else {
      return res.status(404).send("Não foi possível encontrar usuários!");
    }
  }

  async delete(req, res) {
    const user = await User.findByIdAndRemove(req.params.id);
    if (user) {
      return res.status(302).send("Usuário removido com sucesso!");
    } else {
      return res.status(404).send("Usuário não encontrado");
    }
  }

  async update(req, res) {
    try {
      await User.findByIdAndUpdate(
        req.params.id,
        { $set: req.body },
        (err, result) => {
          if (!err) {
            console.log(result);
            return res.status(202).send("Done");
          }
        }
      );
    } catch (err) {
      return res.status(404).send("Não encontrado");
    }
  }
}

module.exports = new UserController();
