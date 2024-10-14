const axios = require("axios");
const User = require("../db/models/user");

const webHookeControllers = {
  // Create a webhook for a repository to track pull requests
  createWebhook: async (req, res) => {
    const { repo } = req.body;
    const user = req.user;

    try {
      const response = await axios.post(
        `https://api.github.com/repos/${user.username}/${repo}/hooks`,
        {
          name: "web",
          config: {
            url: `${process.env.SERVER_URL}/webhooks/pull-request`,
            content_type: "json",
          },
          events: ["pull_request"], // This subscribes to pull request events
          active: true,
        },
        {
          headers: { Authorization: `Bearer ${user.token}` },
        }
      );

      res.json({
        message: "Webhook created successfully",
        hook: response.data,
      });
    } catch (err) {
      res.status(500).json({ message: "Error creating webhook" });
    }
  },

  // Handle pull request webhook events
  handlePullRequest: async (req, res) => {
    const { action, pull_request, repository } = req.body;

    try {
      if (action === "opened") {
        const userId = req.user._id; // Assuming user is attached to req in middleware
        const user = await User.findById(userId);

        if (!user) {
          return res.status(404).json({ message: "User not found" });
        }

        const summary = await generateAISummary(pull_request.body); // Use AI to generate summary

        // Post the AI-generated comment to the pull request
        await axios.post(
          pull_request.comments_url,
          {
            body: `AI Summary: ${summary}`,
          },
          {
            headers: { Authorization: `Bearer ${user.token}` },
          }
        );

        // Save the comment details in the user's aiComments array
        user.aiComments.push({
          repoName: repository.full_name,
          pullRequestId: pull_request.id,
          comment: summary,
        });

        // Save the updated user data to the database
        await user.save();
      }

      res.status(200).send("Pull request handled");
    } catch (error) {
      console.error("Error posting or saving AI comment:", error);
      res.status(500).send("Error handling pull request");
    }
  },
};

module.exports = webHookeControllers;
