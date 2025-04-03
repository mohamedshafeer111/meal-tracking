const express = require("express");
const router = express.Router();

module.exports = (CanteenData,User) => {
  const authenticateToken = require("./middleware")(User);

  /**
 * @swagger
 * /mealweek:
 *   get:
 *     summary: Get weekly meal counts for a specific canteen
 *     description: Fetches the number of Breakfast, Lunch, and Dinner meals served in the past week for the specified canteen.
 *     tags:
 *        - Meals
 *     security:
 *       - BearerAuth: []  # JWT token required
 *     parameters:
 *       - in: query
 *         name: device_trigger
 *         required: true
 *         description: Canteen identifier (device trigger code).
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Weekly meal counts for the specified canteen.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 canteen:
 *                   type: string
 *                 weekly_breakfast_count:
 *                   type: integer
 *                   description: Total breakfast count in the last 7 days.
 *                 weekly_lunch_count:
 *                   type: integer
 *                   description: Total lunch count in the last 7 days.
 *                 weekly_dinner_count:
 *                   type: integer
 *                   description: Total dinner count in the last 7 days.
 *                 total_weekly_count:
 *                   type: integer
 *                   description: Combined total meals count in the last 7 days.
 *       400:
 *         description: device_trigger query parameter is required.
 *       401:
 *         description: Unauthorized - Invalid or missing token.
 *       500:
 *         description: Internal Server Error.
 */

  router.get("/",authenticateToken, async (req, res) => {
    try {
      const today = new Date();
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(today.getDate() - 6); // Get date 6 days before today

      const { device_trigger } = req.query; // Get canteen code from query params

      if (!device_trigger) {
        return res.status(400).json({ error: "device_trigger is required" });
      }

      // Queries for Breakfast, Lunch, Dinner, and Total Meals in the past week for a specific canteen
      const [breakfast, lunch, dinner, totalMeals] = await Promise.all([
        CanteenData.aggregate([
          {
            $match: {
              "meal -type": "Breakfast",
              device_trigger, // Filter by canteen
              created_date_utc: {
                $gte: new Date(oneWeekAgo.toISOString().split("T")[0] + "T00:00:00.000Z"),
                $lt: new Date(today.toISOString().split("T")[0] + "T23:59:59.999Z"),
              },
            },
          },
          { $count: "total_breakfast_count" }
        ]),

        CanteenData.aggregate([
          {
            $match: {
              "meal -type": "Lunch",
              device_trigger,
              created_date_utc: {
                $gte: new Date(oneWeekAgo.toISOString().split("T")[0] + "T00:00:00.000Z"),
                $lt: new Date(today.toISOString().split("T")[0] + "T23:59:59.999Z"),
              },
            },
          },
          { $count: "total_lunch_count" }
        ]),

        CanteenData.aggregate([
          {
            $match: {
              "meal -type": "Dinner",
              device_trigger,
              created_date_utc: {
                $gte: new Date(oneWeekAgo.toISOString().split("T")[0] + "T00:00:00.000Z"),
                $lt: new Date(today.toISOString().split("T")[0] + "T23:59:59.999Z"),
              },
            },
          },
          { $count: "total_dinner_count" }
        ]),

        CanteenData.aggregate([
          {
            $match: {
              "meal -type": { $in: ["Breakfast", "Lunch", "Dinner"] }, // Count all meal types
              device_trigger,
              created_date_utc: {
                $gte: new Date(oneWeekAgo.toISOString().split("T")[0] + "T00:00:00.000Z"),
                $lt: new Date(today.toISOString().split("T")[0] + "T23:59:59.999Z"),
              },
            },
          },
          { $count: "total_meal_count" }
        ]),
      ]);

      // Send response with weekly meal counts for the specific canteen
      res.json({
        canteen: device_trigger,
        weekly_breakfast_count: breakfast[0]?.total_breakfast_count || 0,
        weekly_lunch_count: lunch[0]?.total_lunch_count || 0,
        weekly_dinner_count: dinner[0]?.total_dinner_count || 0,
        total_weekly_count: totalMeals[0]?.total_meal_count || 0
      });

    } catch (error) {
      console.error("Error fetching weekly meal counts:", error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  });

  return router;
};
