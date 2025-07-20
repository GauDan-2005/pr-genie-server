const express = require("express");
const router = express.Router();
const { verify } = require("../controllers/authControllers");

const {
  listRepos,
  getFilteredRepos,
  getRepositoryStats,
  getPullRequestsCount,
  getStarredRepositoriesCount,
  getRepositoryDetails,
  getRepositoryCommits,
  getRepositoryPullRequests,
  getRepositoryCollaborators,
  getRepositoryReadme,
} = require("../controllers/repositoriesController");

// Repository statistics routes (must come before /:filter)
router.get("/stats", verify, getRepositoryStats);
router.get("/pull-requests/count", verify, getPullRequestsCount);
router.get("/starred/count", verify, getStarredRepositoriesCount);

// Repository detail routes (must come before /:filter to avoid conflicts)
router.get("/:owner/:name/details", verify, getRepositoryDetails);
router.get("/:owner/:name/commits", verify, getRepositoryCommits);
router.get("/:owner/:name/pulls", verify, getRepositoryPullRequests);
router.get("/:owner/:name/collaborators", verify, getRepositoryCollaborators);
router.get("/:owner/:name/readme", verify, getRepositoryReadme);

// Repository listing routes
router.get("/", verify, listRepos);
router.get("/:filter", verify, getFilteredRepos);

module.exports = router;
