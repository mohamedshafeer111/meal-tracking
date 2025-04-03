const express = require("express");
const bcrypt = require("bcryptjs");
const router = express.Router();

module.exports = (User) => {
  router.post("/", async (req, res) => {
    try {
      const { userId, password } = req.body;

      // Check if user already exists
      const existingUser = await User.findOne({ userId });
      if (existingUser) {
        return res.status(400).json({ message: "User already exists" });
      }

      // Hash password before saving
      const hashedPassword = await bcrypt.hash(password, 10);
      const newUser = new User({ userId, password: hashedPassword });

      // Save user to database
      await newUser.save();

      res.status(201).json({ message: "User registered successfully" });
    } catch (error) {
      console.error("Signup error:", error);
      res.status(500).json({ message: "Internal Server Error" });
    }
  });

  return router;
};
