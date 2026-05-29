const express = require("express");
const router = express.Router();
const { getCaptcha } = require("../controllers/captchaController");

// @desc    Health check
// @route   GET /console/health
// @access  Public
router.get("/health", (req, res) => {
  res.json({ status: "ok", timestamp: Date.now() });
});

// @desc    Generate captcha
// @route   GET /console/captcha
// @access  Public
router.get("/captcha", getCaptcha);

module.exports = router;
