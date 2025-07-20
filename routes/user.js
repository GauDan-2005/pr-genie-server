const express = require("express");
const router = express.Router();
const {
  getUserComments,
  getUser,
} = require("../controllers/userController");
const { verify } = require("../controllers/authControllers");

// User-specific routes only
router.get("/", verify, getUser);
router.get("/comments", verify, getUserComments);

module.exports = router;
