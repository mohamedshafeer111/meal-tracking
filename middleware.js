const jwt = require("jsonwebtoken");

module.exports = (User) => {
  return async (req, res, next) => {
    const authHeader = req.header("Authorization");
    const token = authHeader && authHeader.split(" ")[1];

    if (!token) {
      return res.status(401).json({ message: "Access denied. No token provided." });
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.userId);

      if (!user) {
        return res.status(401).json({ message: "Invalid token" });
      }

      const now = new Date();
      const lastUsed = user.lastTokenUsed ? new Date(user.lastTokenUsed) : new Date(now - 1000 * 60 * 61); // Default to expired

      if ((now - lastUsed) / (1000 * 60) > 60) {
        return res.status(401).json({ message: "Token expired due to inactivity" });
      }

      user.lastTokenUsed = new Date();
      await user.save();

      req.user = user;
      next();
    } catch (err) {
      return res.status(403).json({ message: "Invalid token" });
    }
  };
};
