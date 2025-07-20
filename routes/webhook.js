const express = require("express");
const router = express.Router();
const {
  createWebhook,
  deleteWebhook,
  getWebhookStatus,
  handlePullRequest,
} = require("../controllers/webhookController");
const { verify } = require("../controllers/authControllers");

router.post("/create-webhook", verify, createWebhook);
router.delete("/delete-webhook", verify, deleteWebhook);
router.get("/status/:repoId", verify, getWebhookStatus);
router.post("/pull-request", handlePullRequest);

module.exports = router;
