const express = require("express");
const bcrypt = require("bcryptjs");
const nodemailer = require("nodemailer");
const cors = require("cors");

const router = express.Router();

router.use(cors({
  origin: "*",
  methods: ["GET", "POST", "PUT", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true
}));

module.exports = (User) => {
  // Nodemailer transporter
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });

  // Function to generate OTP
  const generateOTP = () => Math.floor(1000 + Math.random() * 9000).toString();

  /**
   * @swagger
   * /login:
   *   post:
   *     summary: User login
   *     description: Authenticates the user and sends an OTP to their email.
   *     tags:
   *       - Authentication
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               userId:
   *                 type: string
   *                 example: "user@example.com"
   *               password:
   *                 type: string
   *                 example: "mypassword"
   *     responses:
   *       200:
   *         description: OTP sent successfully.
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 authOTP:
   *                   type: string
   *                   example: "1234"
   *                 userName:
   *                   type: string
   *                   example: "Shafeer"
   *                 email:
   *                   type: string
   *                   example: "user@example.com"
   *                 clientId:
   *                   type: string
   *                   example: "65a12345abcd678901234567"
   *                 statusCode:
   *                   type: integer
   *                   example: 0
   *                 message:
   *                   type: string
   *                   example: "Otp sent to Email"
   *                 isError:
   *                   type: boolean
   *                   example: false
   *                 errorMessage:
   *                   type: string
   *                   example: ""
   *       400:
   *         description: Invalid username or password.
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 authOTP:
   *                   type: string
   *                   nullable: true
   *                   example: null
   *                 userName:
   *                   type: string
   *                   nullable: true
   *                   example: null
   *                 email:
   *                   type: string
   *                   nullable: true
   *                   example: null
   *                 clientId:
   *                   type: string
   *                   nullable: true
   *                   example: null
   *                 statusCode:
   *                   type: integer
   *                   example: 0
   *                 message:
   *                   type: string
   *                   nullable: true
   *                   example: null
   *                 isError:
   *                   type: boolean
   *                   example: true
   *                 errorMessage:
   *                   type: string
   *                   example: "Username/Password is invalid"
   *       500:
   *         description: Internal server error.
   */

  // Login API
  router.post("/", async (req, res) => {
    try {
      const { userId, password } = req.body;

      const user = await User.findOne({ userId });
      if (!user) return res.status(400).json({
        authOTP: null,
        userName: null,
        email: null,
        clientId: null,
        statusCode: 0,
        message: null,
        isError: true,
        errorMessage: "Username/Password is invalid"
      });

      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) return res.status(400).json({
        authOTP: null,
        userName: null,
        email: null,
        clientId: null,
        statusCode: 0,
        message: null,
        isError: true,
        errorMessage: "Username/Password is invalid"
      });

      // Generate OTP
      const twoAuthCode = generateOTP();
      const otpExpires = new Date(Date.now() + 5 * 60 * 1000); // OTP expires in 5 minutes

      user.otp = twoAuthCode;
      user.otpExpires = otpExpires;
      await user.save();

      // Send OTP via Email
      const mailOptions = {
        from: process.env.EMAIL_USER,
        to: userId,
        subject: "Your OTP Code",
        text: `Your OTP code is: ${twoAuthCode}. It will expire in 5 minutes.`
      };

      transporter.sendMail(mailOptions, (error) => {
        if (error) {
          console.error("Error sending OTP:", error);
          return res.status(500).json({ message: "Error sending OTP", error });
        }

        console.log(`OTP sent to ${userId}`);
        res.json({
          authOTP: twoAuthCode,
          userName: "Shafeer",
          email: userId,
          clientId: user._id.toString(),
          statusCode: 0,
          message: "Otp sent to Email",
          isError: false,
          errorMessage: ""
        });
      });

    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ message: "Internal Server Error", error });
    }
  });

  return router;
};
