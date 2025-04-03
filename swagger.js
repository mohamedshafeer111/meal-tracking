const swaggerJsdoc = require("swagger-jsdoc");
const swaggerUi = require("swagger-ui-express");

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Canteen API",
      version: "1.0.0",
      description: "API documentation for the canteen management system",
    },
    servers: [
      {
        url: "http://localhost:5000", // Change this if running in production
      },
    ],
    components: {
      securitySchemes: {
        BearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
      },
    },
    security: [
      {
        BearerAuth: [],
      },
    ],
  },
  apis: ["./login.js", "./verifyotp.js", "./mealtoday.js","./mealweek.js","./mealmonth.js","./report.js","./canteens.js"], // Add mealtoday.js here
};

const swaggerSpec = swaggerJsdoc(options);

module.exports = (app) => {
  app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
  console.log("Swagger docs available at /api-docs");
};
