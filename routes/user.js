const express = require("express");
const router = express.Router();
const {
  listRepos,
  getUserComments,
  getUser,
} = require("../controllers/userController");
const { verify } = require("../controllers/authControllers");

// Routes
router.get("/", verify, getUser);
router.get("/repo", verify, listRepos);
router.get("/ai-comments", verify, async (req, res) => {
  try {
    const userId = req.user.id; // Assuming you have the user info in session
    const aiComments = await getUserComments(userId);
    res.json(aiComments); // Send the comments to the frontend
  } catch (error) {
    res.status(500).send("Error retrieving AI comments");
  }
});

module.exports = router;
