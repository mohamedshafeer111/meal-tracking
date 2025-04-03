const express = require("express");
const router = express.Router();

module.exports = (CanteenData, User) => {
    const authenticateToken = require("./middleware")(User); // Token authentication middleware

    /**
     * @swagger
     * /mealtoday:
     *   get:
     *     summary: Get today's meal counts for a specific canteen
     *     description: Fetches today's count of Breakfast, Lunch, and Dinner meals for a specific canteen .
     *     tags:
     *       - Meals
     *     security:
     *       - BearerAuth: []
     *     parameters:
     *       - in: query
     *         name: device_trigger
     *         required: true
     *         description: Device trigger ID (canteen identifier like MS003)
     *         schema:
     *           type: string
     *     responses:
     *       200:
     *         description: Meal counts for today
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 canteen:
     *                   type: string
     *                 today_breakfast_count:
     *                   type: integer
     *                 today_lunch_count:
     *                   type: integer
     *                 today_dinner_count:
     *                   type: integer
     *                 total_today_count:
     *                   type: integer
     *       400:
     *         description: Missing or invalid device_trigger
     *       401:
     *         description: Unauthorized - Missing or invalid token
     *       500:
     *         description: Internal server error
     */
    router.get("/", authenticateToken, async (req, res) => {
        try {
            const { device_trigger } = req.query;

            if (!device_trigger) {
                return res.status(400).json({ error: "device_trigger is required" });
            }

            // Calculate today's date range in UTC (to match your `created_date_utc` field)
            const now = new Date();
            const todayStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0));
            const todayEnd = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 23, 59, 59, 999));

            // Helper function to get meal count for specific meal type
            const getMealCount = async (mealType) => {
                const result = await CanteenData.aggregate([
                    {
                        $match: {
                            "meal -type": mealType, // Use correct field name here
                            device_trigger,
                            created_date_utc: { $gte: todayStart, $lte: todayEnd }
                        }
                    },
                    {
                        $count: "count"
                    }
                ]);
                return result[0]?.count || 0;
            };

            // Get counts for all meals
            const [breakfastCount, lunchCount, dinnerCount] = await Promise.all([
                getMealCount("Breakfast"),
                getMealCount("Lunch"),
                getMealCount("Dinner")
            ]);

            res.json({
                canteen: device_trigger,
                today_breakfast_count: breakfastCount,
                today_lunch_count: lunchCount,
                today_dinner_count: dinnerCount,
                total_today_count: breakfastCount + lunchCount + dinnerCount,
            });

        } catch (error) {
            console.error("Error fetching today's meal counts:", error);
            res.status(500).json({ error: "Internal Server Error" });
        }
    });

    return router;
};
