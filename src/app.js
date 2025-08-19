const express = require("express");
const cors = require("cors");
const helmet = require("helmet");

const app = express();

// Basic middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// Basic route
app.get("/", (req, res) => {
  res.json({
    message: "🎉 Awesome Todo App API - Ready for Development!",
    status: "success",
    timestamp: new Date().toISOString(),
  });
});

module.exports = app;
