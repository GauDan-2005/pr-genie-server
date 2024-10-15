const express = require("express");
const router = express.Router();
const ensureAuthenticated = require("../middlewares/authMiddleware");
const {
  createWebhook,
  handlePullRequest,
} = require("../controllers/webhookController");

router.post("/create-webhook", ensureAuthenticated, createWebhook);
router.post("/pull-request", handlePullRequest);

module.exports = router;
