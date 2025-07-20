const axios = require("axios");
const User = require("../db/models/user");
const { generateSummary } = require("../services/gemeni");
const comment = require("../db/models/comment");
const Repository = require("../db/models/Repository");

const webHookeControllers = {
  // Get webhook status for a repository
  getWebhookStatus: async (req, res) => {
    const { repoId } = req.params;
    const user = await User.findById(req.user);
    
    try {
      const repository = await Repository.findOne({ repoId: repoId });
      
      if (!repository || !repository.webhookId) {
        return res.json({ active: false, webhookId: null });
      }

      // Verify webhook still exists on GitHub
      try {
        const response = await axios.get(
          `https://api.github.com/repos/${user.username}/${repository.repoName}/hooks/${repository.webhookId}`,
          {
            headers: { Authorization: `Bearer ${user.token}` },
          }
        );
        
        res.json({ 
          active: response.data.active, 
          webhookId: repository.webhookId,
          config: response.data.config 
        });
      } catch (githubError) {
        // Webhook doesn't exist on GitHub anymore, clean up database
        repository.webhookId = null;
        await repository.save();
        res.json({ active: false, webhookId: null });
      }
    } catch (error) {
      console.error("Error checking webhook status:", error);
      res.status(500).json({ message: "Error checking webhook status" });
    }
  },
  // Create a webhook for a repository to track pull requests
  createWebhook: async (req, res) => {
    const { repo } = req.body;
    console.log(repo);
    const user = await User.findById(req.user);

    console.log(
      `Creating webhook for repo: ${repo.name} with owner: ${user.username}`
    );

    try {
      const response = await axios.post(
        `https://api.github.com/repos/${user.username}/${repo.name}/hooks`,
        {
          name: "web",
          config: {
            url: `${process.env.SERVER_URL}/webhooks/pull-request`,
            content_type: "json",
          },
          events: ["pull_request", "pull_request_review_comment"], // This subscribes to pull request events
          active: true,
        },
        {
          headers: { Authorization: `Bearer ${user.token}` },
        }
      );

      const repoDB = await Repository.findOne({ repoId: Repository.id });
      if (repoDB) {
        repoDB.webhookId = response.data.id;
        await repoDB.save();
      } else {
        const newRepo = new Repository({
          repoName: repo.name,
          repoId: repo.id,
          repoUrl: repo.html_url,
          comment: [],
          webhookId: response.data.id,
        });
        await newRepo.save();
        user.repository.push(newRepo);
        await user.save();
      }

      console.log("Webhook created successfully");

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

  // delete a webhook for a repository
  deleteWebhook: async (req, res) => {
    const { repo } = req.body;
    const user = await User.findById(req.user);
    // Find the repository in the database
    const repository = await Repository.findOne({
      repoId: repo.id,
    });

    if (!repository) {
      return res
        .status(404)
        .json({ message: "No webhooks found in this Repository." });
    }

    console.log(
      `Deleting webhook for repo: ${repo.name} with hook ID: ${repository.webhookId}`
    );

    try {
      // Send a DELETE request to GitHub API to remove the webhook
      const response = await axios.delete(
        `https://api.github.com/repos/${user.username}/${repository.repoName}/hooks/${repository.webhookId}`,
        {
          headers: {
            Authorization: `Bearer ${user.token}`,
          },
        }
      );

      console.log("Webhook deleted successfully from GitHub:", response.data);

      // Remove the webhook ID from the repository in the database
      repository.webhookId = null;
      await repository.save();

      res.json({
        message: "Webhook deleted successfully from GitHub and database",
      });
    } catch (err) {
      console.error(
        "Error deleting webhook:",
        err.response?.data || err.message
      );
      res.status(500).json({
        message: err.response?.data?.message || "Error deleting webhook",
      });
    }
  },

  // Handle pull request webhook events
  handlePullRequest: async (req, res) => {
    const { action, pull_request, repository } = req.body;
    console.log("Repo:", repository);
    console.log("Pull-Request:", pull_request);
    console.log("action:", action);
    try {
      if (action === "opened") {
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

        // Save the comment details in the comment schema file
        const aiComment = new comment({
          branch: "master",
          pullRequestId: pull_request.id,
          comment: `AI Comment sent:\nPR-Genie Summary:\n${summaryText}`,
        });

        await aiComment.save();

        // add the comment to the repository
        const repo = await Repository.findOne({ repoId: repository.id });
        if (repo) {
          repo.comment.push(aiComment);
          await repo.save();
        } else {
          res.status(500).send("Repository not found");
        }

        // user.aiComments.push({
        //   repoName: repository.full_name,
        //   pullRequestId: pull_request.id,
        //   comment: "AI Comment sent:\n`PR-Genie Summary:\n${summaryText}`",
        // });

        // Save the updated user data to the database
      }

      res.status(200).send("Pull request handled");
    } catch (error) {
      console.error("Error posting or saving AI comment:", error);
      res.status(500).send("Error handling pull request");
    }
  },
};

module.exports = webHookeControllers;
