
const express = require("express");
const router = express.Router();

module.exports = (CanteenData, authenticateToken) => {


/**
 * @swagger
 * /canteens:
 *   get:
 *     summary: Get list of all available canteens
 *     description: Returns a list of all distinct canteens found in the data.
 *     tags:
 *       - Meals
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: List of canteens
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 canteens:
 *                   type: array
 *                   items:
 *                     type: string
 *       401:
 *         description: Unauthorized - Missing or invalid token
 *       500:
 *         description: Internal server error
 */
router.get("/", async (req, res) => {
    try {
        // 1️⃣ Fetch distinct (unique) canteen device triggers from the database
        const canteens = await CanteenData.distinct("device_trigger", {
            "device_trigger": { $ne: "" }
        });

        // 2️⃣ Format each device_trigger into an object with a `code` and `name`
        const formattedCanteens = canteens.map((code, index) => ({
            code,                       // Original device_trigger value (like MS003)
            name: `Canteen ${index + 1}` // Friendly name like Canteen 1, Canteen 2...+
        }));

        // 3️⃣ Send the formatted list as the response
        res.json(formattedCanteens);

    } catch (error) {
        // 4️⃣ Handle errors
        console.error("Error fetching canteens:", error);
        res.status(500).json({ message: "Failed to fetch canteens" });
    }
});

return router;
}


