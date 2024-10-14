const express = require("express");
const router = express.Router();
const ensureAuthenticated = require("../middlewares/authMiddleware");
const { listRepos, getUserComments } = require("../controllers/userController");

router.get("/", ensureAuthenticated, listRepos);
router.get("/ai-comments", async (req, res) => {
  try {
    const userId = req.user.id; // Assuming you have the user info in session
    const aiComments = await getUserComments(userId);
    res.json(aiComments); // Send the comments to the frontend
  } catch (error) {
    res.status(500).send("Error retrieving AI comments");
  }
});

module.exports = router;
