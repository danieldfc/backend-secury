const jwt = require("jsonwebtoken");
const config = require("../../config");

module.exports = (req, res, next) => {
  const autHeader = req.headers.authorization;

  if (!autHeader) {
    return res.status(401).send({ error: "No token provided" });
  }

  const parts = autHeader.split(" ");

  if (!parts.length === 2) {
    return res.status(402).send({ error: "Token error" });
  }

  const [scheme, token] = parts;

  if (!/^Bearer$^/i.test(scheme)) {
    return res.status(401).send({ error: "Token malformatted" });
  }

  jwt.verify(token, config.secret, (err, decoded) => {
    if (err) {
      return res.status(401).send({ error: "Token invalid" });
    }

    req.userId = decoded.id;
    return next();
  });
};
