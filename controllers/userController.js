const axios = require("axios");
const User = require("../db/models/user");

const userControllers = {
  getUserComments: async (req, res) => {
    const userId = req.user._id;

    try {
      const user = await User.findById(userId);
      if (user) {
        return res.json(user.aiComments); // Return the list of AI comments
      }
      return res.status(404).json({ message: "User not found" });
    } catch (error) {
      console.error("Error fetching AI comments:", error);
      return res.status(500).json({ message: "Error fetching AI comments" });
    }
  },
  // List all repositories for a logged-in user
  listRepos: async (req, res) => {
    const user = req.user;
    try {
      const response = await axios.get("https://api.github.com/user/repos", {
        headers: { Authorization: `Bearer ${user.token}` },
      });

      const ownedRepos = response.data.filter(
        (repo) => repo.owner.login === user.username
      );

      res.json(ownedRepos);
    } catch (err) {
      res.status(500).json({ message: "Error fetching repositories" });
    }
  },
};

module.exports = userControllers;
