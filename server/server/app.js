const express = require("express");
const cors = require("cors");

const marketRoutes = require("./routes/MarketRoutes");
const smcRoutes = require("./routes/smcRoutes");

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/smc", smcRoutes);

//Register market routes
app.use("/api", marketRoutes);

app.get("/", (req, res) => {
  res.json({
    status: "Server running",
  });
});

module.exports = app;
