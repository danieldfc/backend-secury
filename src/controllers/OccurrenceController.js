const Occurrence = require("../models/Occurrence");

class OccurrenceController {
  async store(req, res) {
    const occurrence = await Occurrence.create(req.body);

    return res.json(occurrence);
  }

  async show(req, res) {
    try {
      const occurrence = await Occurrence.findById(req.params.id);
      if (occurrence) {
        return res.status(302).json(occurrence);
      }
    } catch (err) {
      return res.status(404).send("Não encontrado");
    }
  }

  async all(req, res) {
    const occurrence = await Occurrence.find();
    if (occurrence.length) {
      return res.status(200).json(occurrence);
    } else {
      return res.status(404).send("Não foi possível encontrar usuários!");
    }
  }

  async delete(req, res) {
    const occurrence = await Occurrence.findByIdAndRemove(req.params.id);
    if (user) {
      return res.status(302).send("Usuário removido com sucesso!");
    } else {
      return res.status(404).send("Usuário não encontrado");
    }
  }

  async update(req, res) {
    try {
      await Occurrence.findByIdAndUpdate(
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

module.exports = new OccurrenceController();
