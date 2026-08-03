const express = require("express");

const router = express.Router();

const { detectMarketStructure } = require("../controllers/SMCController");

router.get("/swings", detectMarketStructure);

module.exports = router;
