const express = require("express");

const router = express.Router();

const { detectMarketStructure } = require("../controllers/SMCController");
const validateMarketRequest = require("../middleware/ValidateMarketRequest");

router.get("/swings", validateMarketRequest, detectMarketStructure);

module.exports = router;
