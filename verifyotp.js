const express = require("express");
const jwt = require("jsonwebtoken");

module.exports = (User) => {
  const router = express.Router();

  /**
   * @swagger
   * /verifyotp:
   *   post:
   *     summary: Verify OTP and generate JWT token
   *     description: Authenticates the user with an OTP, issues a JWT token, and sets user session details.
   *     tags:
   *       - Authentication
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - userId
   *               - twoAuthCode
   *             properties:
   *               userId:
   *                 type: string
   *                 example: "user@example.com"
   *               twoAuthCode:
   *                 type: string
   *                 example: "123456"
   *     responses:
   *       200:
   *         description: OTP verified successfully, JWT token returned.
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 token:
   *                   type: string
   *                   example: "eyJhbGciOiJIUzI1..."
   *                 userName:
   *                   type: string
   *                   example: "Shafeer"
   *                 expiresIn:
   *                   type: string
   *                   nullable: true
   *                   example: null
   *                 clientID:
   *                   type: string
   *                   example: "C01"
   *                 roleId:
   *                   type: string
   *                   example: "524"
   *                 superAdmin:
   *                   type: boolean
   *                   example: false
   *                 statusCode:
   *                   type: integer
   *                   example: 200
   *                 message:
   *                   type: string
   *                   example: "Login Successfully"
   *                 isError:
   *                   type: boolean
   *                   example: false
   *       400:
   *         description: OTP is invalid or expired.
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 message:
   *                   type: string
   *                   example: "OTP is invalid or expired"
   *                 isError:
   *                   type: boolean
   *                   example: true
   */

  router.post("/", async (req, res) => {
    const { userId, twoAuthCode } = req.body;

    const user = await User.findOne({ userId });
    if (!user || user.otp !== twoAuthCode) {
      return res.status(400).json({
        message: "OTP is invalid or expired",
        isError: true,
      });
    }

    // Check OTP expiration
    if (new Date() > user.otpExpires) {
      return res.status(400).json({ message: "OTP expired" });
    }

    // Generate a JWT token without expiration (handled via inactivity)
    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET);

    // Store token and set last used time
    user.token = token;
    user.lastTokenUsed = new Date();
    user.otp = null;
    user.otpExpires = null;
    await user.save();

    res.json({
      token,
      userName: "Shafeer",
      expiresIn: null, // No fixed expiry, handled by inactivity check
      clientID: "C01",
      roleId: "524",
      superAdmin: false,
      statusCode: 200,
      message: "Login Successfully",
      isError: false,
    });
  });

  return router;
};
