const express = require("express");
const router = express.Router();

module.exports = (CanteenData,User) => {
  const authenticateToken = require("./middleware")(User);
  /**
 * @swagger
 * /mealmonth:
 *   get:
 *     summary: Get monthly meal counts for a specific canteen
 *     description: Fetches the number of Breakfast, Lunch, and Dinner meals served in the past month for the specified canteen.
 *     tags:
 *      - Meals
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
 *         description: Monthly meal counts for the specified canteen.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 canteen:
 *                   type: string
 *                   description: Canteen code provided in the request.
 *                 monthly_breakfast_count:
 *                   type: integer
 *                   description: Total breakfast count in the past 30 days.
 *                 monthly_lunch_count:
 *                   type: integer
 *                   description: Total lunch count in the past 30 days.
 *                 monthly_dinner_count:
 *                   type: integer
 *                   description: Total dinner count in the past 30 days.
 *                 total_monthly_count:
 *                   type: integer
 *                   description: Combined total meals count in the past 30 days.
 *       400:
 *         description: device_trigger query parameter is required.
 *       401:
 *         description: Unauthorized - Invalid or missing token.
 *       500:
 *         description: Internal Server Error.
 */

  router.get("/", authenticateToken,async (req, res) => {
    try {
      const today = new Date();
      const oneMonthAgo = new Date();
      oneMonthAgo.setDate(today.getDate() - 29); // Past 30 days

      const startOfMonth = new Date(oneMonthAgo.setHours(0, 0, 0, 0)); // Start of the day
      const endOfMonth = new Date(today.setHours(23, 59, 59, 999)); // End of the day

      const { device_trigger } = req.query; // Get single canteen code from query params

      if (!device_trigger) {
        return res.status(400).json({ error: "device_trigger is required" });
      }

      // Queries for Breakfast, Lunch, and Dinner for a single canteen
      const [breakfast, lunch, dinner] = await Promise.all([
        CanteenData.aggregate([
          { 
            $match: { 
              "meal -type": "Breakfast", 
              device_trigger, // Filter by canteen
              created_date_utc: { $gte: startOfMonth, $lte: endOfMonth } 
            } 
          },
          { $count: "count" }
        ]),
        CanteenData.aggregate([
          { 
            $match: { 
              "meal -type": "Lunch", 
              device_trigger, 
              created_date_utc: { $gte: startOfMonth, $lte: endOfMonth } 
            } 
          },
          { $count: "count" }
        ]),
        CanteenData.aggregate([
          { 
            $match: { 
              "meal -type": "Dinner", 
              device_trigger, 
              created_date_utc: { $gte: startOfMonth, $lte: endOfMonth } 
            } 
          },
          { $count: "count" }
        ])
      ]);

      // Calculate total meals in the month
      const total_monthly_count = 
        (breakfast[0]?.count || 0) + 
        (lunch[0]?.count || 0) + 
        (dinner[0]?.count || 0);

      // Send response for the specific canteen
      res.json({
        canteen: device_trigger,
        monthly_breakfast_count: breakfast[0]?.count || 0,
        monthly_lunch_count: lunch[0]?.count || 0,
        monthly_dinner_count: dinner[0]?.count || 0,
        total_monthly_count: total_monthly_count
      });

    } catch (error) {
      console.error("Error fetching monthly meal counts:", error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  });

  return router;
};
