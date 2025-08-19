const express = require("express");
const cors = require("cors");
const helmet = require("helmet");

// Route files
const authRoutes = require('./routes/auth');
const todoRoutes = require('./routes/todos');
const projectRoutes = require('./routes/projects');
const errorHandler = require('./middleware/errorHandler');

const app = express();

// Basic middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// Mount routers
app.use('/api/auth', authRoutes);
app.use('/api/todos', todoRoutes);
app.use('/api/projects', projectRoutes);

app.get("/", (req, res) => {
  res.json({
    message: "Awesome Todo App API is running!",
    status: "success",
  });
});

// Error handler middleware
app.use(errorHandler);

module.exports = app;
