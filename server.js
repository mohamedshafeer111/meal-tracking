require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");


const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(express.json());
app.use(cors({
  origin: "*",
  methods: ["GET", "POST", "PUT", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true
}));

// Connect to MongoDB
const mongoURI = process.env.MONGO_URI;
mongoose.connect(mongoURI)
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.log("Error connecting MongoDB Atlas:", err));


// Import routes
const CanteenData = mongoose.model("CanteenData", new mongoose.Schema({}, { strict: false }), "Canteen_1");

const UserSchema = new mongoose.Schema({
  userId: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  otp: String,
  otpExpires: Date,
  lastTokenUsed: Date // Add this field
});
const User = mongoose.model("User", UserSchema);
module.exports = { User };


const mealTodayRoutes = require("./mealtoday")(CanteenData, User);  // Pass User
app.use("/mealtoday", mealTodayRoutes);


const mealWeekRoutes = require("./mealweek")(CanteenData, User);
app.use("/mealweek", mealWeekRoutes);

const mealmonthRoutes = require("./mealmonth")(CanteenData,User);
app.use("/mealmonth", mealmonthRoutes);

const loginRoute = require("./login")(User);
app.use("/login", loginRoute);

const signupRoute = require("./signup")(User);
app.use("/signup", signupRoute);

const verifyotpRoute = require("./verifyotp")(User);
app.use("/verifyotp", verifyotpRoute);

const authenticateToken = require("./middleware")(User);
const reportRoutes = require("./report")(CanteenData,authenticateToken);
app.use("/get-report", reportRoutes);

const forgotpasswordRoutes = require("./forgotpassword")(User);
app.use("/forgotpassword", forgotpasswordRoutes);

const verifyresetotpRoutes = require("./verifyresetotp")(User);
app.use("/verifyresetotp",verifyresetotpRoutes )

const resetpasswordRoutes = require("./resetpassword")(User);
app.use("/resetpassword", resetpasswordRoutes);

const canteensRoute = require("./canteens")(CanteenData, authenticateToken);
app.use("/canteens", canteensRoute);

// const pdfRoute = require("./report-pdf")(CanteenData,authenticateToken);
// app.use("/get-report-pdf",pdfRoute)


// Import and use Swagger
const swaggerSetup = require("./swagger");
swaggerSetup(app);
console.log("Swagger setup completed. Check http://localhost:5000/api-docs");



// Start server
app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on port ${PORT}`);
});
