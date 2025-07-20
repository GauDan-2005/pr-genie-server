const express = require("express");
const router = express.Router();
const { verify } = require("../controllers/authControllers");
const {
  getAIComments,
  getAICommentsStats,
} = require("../controllers/commentsController");

// AI Comments routes
router.get("/", verify, getAIComments);
router.get("/stats", verify, getAICommentsStats);

module.exports = router;