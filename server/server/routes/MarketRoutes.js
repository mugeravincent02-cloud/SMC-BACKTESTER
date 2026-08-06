const express = require("express");
const router = express.Router();

const MarketController = require("../controllers/MarketController");

//GET/api/candles

const validateMarketRequest = require("../middleware/ValidateMarketRequest");

router.get("/candles", validateMarketRequest, MarketController.getCandles);

module.exports = router;
