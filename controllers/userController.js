const axios = require("axios");
const User = require("../db/models/user");

const userControllers = {
  getUser: async (req, res) => {
    try {
      const user = await User.findById(req.user);
      if (!user) {
        return res.status(401).json({ message: "User not found." });
      }
      res.status(200).json({ message: "User fetched successfully", user });
    } catch (error) {
      console.error("Error fetching user: ", error);
      return res.status(500).json({ message: "Error fetching user" });
    }
  },
  getUserComments: async (userId) => {
    try {
      const user = await User.findById(userId);
      if (user) {
        return user.aiComments; // Return the list of AI comments
      }
      return null;
    } catch (error) {
      console.error("Error fetching AI comments:", error);
      throw error;
    }
  },
};

module.exports = userControllers;
