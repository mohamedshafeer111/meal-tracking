const express = require("express");
const bcrypt = require("bcryptjs");
const router = express.Router();

module.exports = (User) => {
  router.post("/", async (req, res) => {
    try {
      const { pass, confirmpass } = req.body;

      if (!pass || !confirmpass) {
        return res.status(400).json({ message: "Both password fields are required" });
      }

      if (pass !== confirmpass) {
        return res.status(400).json({ message: "Passwords do not match" });
      }

      // Find the user who has verified OTP
      const user = await User.findOne({ isVerified: true }).exec();
      if (!user) {
        return res.status(400).json({ message: "No verified user found. Please verify OTP again." });
      }

      // Hash and update the password
      const hashedPassword = await bcrypt.hash(pass, 10);
      user.password = hashedPassword;

      // Reset verification status after password change
      user.isVerified = false;
      await user.save();

      res.status(200).json({ message: "Password reset successfully" });

    } catch (error) {
      console.error("Error resetting password:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  return router;
};
