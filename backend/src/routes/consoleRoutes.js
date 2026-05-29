const express = require("express");
const router = express.Router();

// @desc    Health check
// @route   GET /console/healther
// @access  Public
router.get("/health", (req, res) => {
  res.json({ status: "ok", timestamp: Date.now() });
});

module.exports = router;
