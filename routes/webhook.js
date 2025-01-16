const express = require("express");
const router = express.Router();
const {
  createWebhook,
  handlePullRequest,
} = require("../controllers/webhookController");
const { verify } = require("../controllers/authControllers");

router.post("/create-webhook", verify, createWebhook);
router.post("/pull-request", handlePullRequest);

module.exports = router;
