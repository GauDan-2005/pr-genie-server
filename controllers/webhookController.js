const axios = require("axios");
const User = require("../db/models/user");
const { generateSummary } = require("../services/gemeni");

const webHookeControllers = {
  // Create a webhook for a repository to track pull requests
  createWebhook: async (req, res) => {
    const { repo } = req.body;
    const user = await User.findById(req.user);

    console.log(
      `Creating webhook for repo: ${repo} with owner: ${user.username}`
    );

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
      console.error(
        "Error creating webhook:",
        err.response?.data || err.message
      );
      res.status(500).json({
        message: err.response?.data?.message || "Error creating webhook",
      });
    }
  },

  // Handle pull request webhook events
  handlePullRequest: async (req, res) => {
    const { action, pull_request, repository } = req.body;

    try {
      if (action === "opened") {
        console.log(repository);
        const username = repository.owner.login;
        const user = await User.findOne({ username });

        if (!user) {
          return res.status(404).json({ message: "User not found" });
        }

        const diffCodeResponse = await axios.get(pull_request.diff_url);

        const commitsResponse = await axios.get(pull_request.commits_url);
        const commits = commitsResponse.data;

        // Prepare a summary of changes
        let summary = `Pull Request Summary:\n`;
        summary += `Title: ${pull_request.title}\n`;
        summary += `Total Changes: ${pull_request.changed_files} files changed, ${pull_request.additions} additions, ${pull_request.deletions} deletions.\n\n`;

        summary += `Commits:\n`;
        commits.forEach((commit) => {
          summary += `- ${commit.commit.message} (by ${commit.commit.author.name})\n`;
        });

        const difference_code = diffCodeResponse.data;
        const pull_request_title = pull_request.title;
        const changed_files = pull_request.changed_files;
        const additions = pull_request.additions;
        const deletions = pull_request.deletions;
        const commits_description = commits
          .map((commit) => commit.commit.message)
          .join(", ");

        const [summaryText, summaryError] = await generateSummary({
          difference_code,
          pull_request_title,
          changed_files,
          additions,
          deletions,
          commits_description,
        });

        if (summaryError) {
          console.error("Error generating summary:", summaryError);
          return res.status(500).json({ message: "Error generating summary" });
        }

        // Post the AI-generated comment to the pull request
        await axios.post(
          pull_request.comments_url,
          {
            body: `PR-Genie Summary:\n${summaryText}`,
          },
          {
            headers: { Authorization: `Bearer ${user.token}` },
          }
        );

        // Save the comment details in the user's aiComments array
        user.aiComments.push({
          repoName: repository.full_name,
          pullRequestId: pull_request.id,
          comment: "AI Comment sent",
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
