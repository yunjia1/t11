const express = require("express");
const cors = require("cors");
const routes = require("./routes");

// Load environment variables
require("dotenv").config();

const app = express();

// Configure CORS to allow requests only from the frontend
const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:5173";

// CORS middleware configuration
app.use(cors({
  origin: FRONTEND_URL,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true
}));

app.use(express.json());
app.use('', routes);

module.exports = app;