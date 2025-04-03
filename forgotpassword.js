const express = require("express");
const nodemailer = require("nodemailer");
const router = express.Router();

module.exports = (User) => {
  router.post("/", async (req, res) => {
    try {
      const { userId } = req.body;

      if (!userId) {
        return res.status(400).json({ message: "User ID is required" });
      }

      const user = await User.findOne({ userId }).exec();
      if (!user) {
        return res.status(400).json({ message: "User not found" });
      }

      // Generate a 4-digit OTP
      const otp = Math.floor(1000 + Math.random() * 9000);
      const otpExpires = new Date(Date.now() + 5 * 60 * 1000); // 5-minute expiry

      // Save OTP to the user document
      user.otp = otp;
      user.otpExpires = otpExpires;
      await user.save();

      // Send OTP via email
      const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS,
        },
      });

      const mailOptions = {
        from: process.env.EMAIL_USER,
        to: userId,
        subject: "Password Reset OTP",
        text: `Your OTP for password reset is: ${otp}. This OTP will expire in 5 minutes.`,
      };

      await transporter.sendMail(mailOptions);

      res.status(200).json({ message: "OTP sent successfully",
        resetOTP:otp
       });

    } catch (error) {
      console.error("Error sending OTP:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  return router;
};
