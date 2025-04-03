const express = require("express");
const PDFDocument = require("pdfkit");

const router = express.Router();

function parseDateToUTC(dateStr) {
  return new Date(dateStr + "T00:00:00.000Z");
}

module.exports = (CanteenData, authenticateToken) => {



  /**
 * @swagger
 * /get-report:
 *   get:
 *     summary: Get meal report in JSON or PDF format
 *     description: Fetches meal records for a given date range and allows exporting the report as JSON or PDF.
 *     tags:
 *       - Meals
 *     security:
 *       - BearerAuth: []  # JWT token required
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Start date (YYYY-MM-DD) for fetching meal records. Defaults to 30 days before today.
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: End date (YYYY-MM-DD) for fetching meal records. Defaults to today.
 *       - in: query
 *         name: format
 *         schema:
 *           type: string
 *           enum: [json, pdf]
 *         description: Specify "pdf" to download the report as a PDF file. Defaults to JSON.
 *     responses:
 *       200:
 *         description: Returns meal report in JSON or triggers PDF download.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 report_start_date:
 *                   type: string
 *                   format: date
 *                 report_end_date:
 *                   type: string
 *                   format: date
 *                 total_entries:
 *                   type: integer
 *                 meals:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       date:
 *                         type: string
 *                         format: date
 *                       Dinner_Type:
 *                         type: string
 *                       person_id:
 *                         type: string
 *                       person_name:
 *                         type: string
 *                       meal_type:
 *                         type: string
 *       400:
 *         description: Bad request - Invalid query parameters.
 *       401:
 *         description: Unauthorized - Invalid or missing token.
 *       500:
 *         description: Internal Server Error.
 */

  router.get("/", authenticateToken, async (req, res) => {
    try {
      let { startDate, endDate, format } = req.query; // Added 'format' to check if PDF is needed
      const today = new Date();

      const maxStartDate = new Date();
      maxStartDate.setUTCDate(today.getUTCDate() - 29);
      maxStartDate.setUTCHours(0, 0, 0, 0);

      const defaultEndDate = new Date();
      defaultEndDate.setUTCHours(23, 59, 59, 999);

      let start = startDate ? parseDateToUTC(startDate) : maxStartDate;
      start.setUTCHours(0, 0, 0, 0);
      if (start < maxStartDate) start = maxStartDate;

      let end = endDate ? parseDateToUTC(endDate) : defaultEndDate;
      end.setUTCHours(23, 59, 59, 999);
      if (end > defaultEndDate) end = defaultEndDate;

      const meals = await CanteenData.find({
        created_date_utc: { $gte: start, $lte: end }
      }).sort({ created_date_utc: 1 }).lean();

      const formattedData = meals.map((meal) => ({
        date: meal.created_date_utc.toISOString().split("T")[0],
        Dinner_Type: meal.Type || "N/A",
        person_id: meal.sensor_attributes?.person_id || "N/A",
        person_name: meal.sensor_attributes?.person_name || "N/A",
        meal_type: meal["meal -type"] || "N/A"
      }));

      if (format === "pdf") {
        // **Generate PDF Report**
        const doc = new PDFDocument();
        const fileName = `Meal_Report_${start.toISOString().split("T")[0]}_to_${end.toISOString().split("T")[0]}.pdf`;

        res.setHeader("Content-Disposition", `attachment; filename=${fileName}`);
        res.setHeader("Content-Type", "application/pdf");

        doc.pipe(res);

        doc.fontSize(16).text("Canteen Meal Report", { align: "center" });
        doc.moveDown();
        doc.fontSize(12).text(`Report Start Date: ${start.toISOString().split("T")[0]}`);
        doc.text(`Report End Date: ${end.toISOString().split("T")[0]}`);
        doc.text(`Total Entries: ${formattedData.length}`);
        doc.moveDown();

        formattedData.forEach((meal, index) => {
          doc.fontSize(10).text(`${index + 1}. Date: ${meal.date}`);
          doc.text(`   Dinner Type: ${meal.Dinner_Type}`);
          doc.text(`   Person ID: ${meal.person_id}`);
          doc.text(`   Person Name: ${meal.person_name}`);
          doc.text(`   Meal Type: ${meal.meal_type}`);
          doc.moveDown();
        });

        doc.end();
      } else {
        // **Return JSON Response**
        res.json({
          report_start_date: start.toISOString().split("T")[0],
          report_end_date: end.toISOString().split("T")[0],
          total_entries: formattedData.length,
          meals: formattedData
        });
      }
    } catch (error) {
      console.error("Error generating report:", error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  });

  return router;
};
