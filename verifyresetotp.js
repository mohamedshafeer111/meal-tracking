const express = require("express");
const router = express.Router();

module.exports = (User) => {
  router.post("/", async (req, res) => {
    try {
      const { resetOTP } = req.body;

      if (!resetOTP) {
        return res.status(400).json({ message: "OTP is required" });
      }

      const user = await User.findOne({ otp: resetOTP }).exec();
      if (!user) {
        return res.status(400).json({ message: "Invalid OTP" });
      }

      // Check if OTP is expired
      if (new Date() > user.otpExpires) {
        return res.status(400).json({ message: "OTP expired" });
      }

      // Mark the user as verified for password reset
      user.isVerified = true;
      user.otp = null; // Clear OTP after successful verification
      user.otpExpires = null;
      await user.save();

      res.status(200).json({ message: "OTP verified successfully" });

    } catch (error) {
      console.error("Error verifying OTP:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  return router;
};
