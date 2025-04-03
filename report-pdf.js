// const express = require("express");
// const PDFDocument = require("pdfkit");

// const router = express.Router();

// function parseDateToUTC(dateStr) {
//   return new Date(dateStr + "T00:00:00.000Z");
// }

// module.exports = (CanteenData, authenticateToken) => {
//   router.get("/", authenticateToken, async (req, res) => {
//     try {
//       let { startDate, endDate } = req.query;
//       const today = new Date();

//       const maxStartDate = new Date();
//       maxStartDate.setUTCDate(today.getUTCDate() - 29);
//       maxStartDate.setUTCHours(0, 0, 0, 0);

//       const defaultEndDate = new Date();
//       defaultEndDate.setUTCHours(23, 59, 59, 999);

//       let start = startDate ? parseDateToUTC(startDate) : maxStartDate;
//       start.setUTCHours(0, 0, 0, 0);
//       if (start < maxStartDate) start = maxStartDate;

//       let end = endDate ? parseDateToUTC(endDate) : defaultEndDate;
//       end.setUTCHours(23, 59, 59, 999);
//       if (end > defaultEndDate) end = defaultEndDate;

//       const meals = await CanteenData.find({
//         created_date_utc: { $gte: start, $lte: end }
//       }).sort({ created_date_utc: 1 }).lean();

//       const formattedData = meals.map((meal) => ({
//         date: meal.created_date_utc.toISOString().split("T")[0],
//         Dinner_Type: meal.Type || "N/A",
//         person_id: meal.sensor_attributes?.person_id || "N/A",
//         person_name: meal.sensor_attributes?.person_name || "N/A",
//         meal_type: meal["meal -type"] || "N/A"
//       }));

//       // **Create PDF Document**
//       const doc = new PDFDocument();
//       const fileName = `Meal_Report_${start.toISOString().split("T")[0]}_to_${end.toISOString().split("T")[0]}.pdf`;

//       res.setHeader("Content-Disposition", `attachment; filename=${fileName}`);
//       res.setHeader("Content-Type", "application/pdf");

//       doc.pipe(res);

//       doc.fontSize(16).text("Canteen Meal Report", { align: "center" });
//       doc.moveDown();
//       doc.fontSize(12).text(`Report Start Date: ${start.toISOString().split("T")[0]}`);
//       doc.text(`Report End Date: ${end.toISOString().split("T")[0]}`);
//       doc.text(`Total Entries: ${formattedData.length}`);
//       doc.moveDown();

//       formattedData.forEach((meal, index) => {
//         doc.fontSize(10).text(`${index + 1}. Date: ${meal.date}`);
//         doc.text(`   Dinner Type: ${meal.Dinner_Type}`);
//         doc.text(`   Person ID: ${meal.person_id}`);
//         doc.text(`   Person Name: ${meal.person_name}`);
//         doc.text(`   Meal Type: ${meal.meal_type}`);
//         doc.moveDown();
//       });

//       doc.end();
//     } catch (error) {
//       console.error("Error generating PDF report:", error);
//       res.status(500).json({ error: "Internal Server Error" });
//     }
//   });

//   return router;
// };
