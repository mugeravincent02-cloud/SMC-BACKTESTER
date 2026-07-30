const express = require("express");
const cors = require("cors");

const marketRoutes = require("./routes/MarketRoutes");

const app = express();

app.use(cors());
app.use(express.json());

//Register market routes
app.use("/api", marketRoutes);

app.get("/", (req, res) => {
  res.json({
    status: "Server running",
  });
});

module.exports = app;
