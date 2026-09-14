import jwt from "jsonwebtoken";

export function authenticateToken(req, res, next) {
  // if (req.route.path === "/files/:chatId/:chatId/attachments") {
  //   next();
  // }

  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];
  if (token == null) {
    return res
      .status(401)
      .json({ error: { message: "Not authorized", code: "AUTH" } });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
}
