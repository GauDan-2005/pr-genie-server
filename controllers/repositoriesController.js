const axios = require("axios");
const User = require("../db/models/user");

// List all repositories for a logged-in user with pagination
const listRepos = async (req, res) => {
  const user = await User.findById(req.user);
  const {
    page = 1,
    limit = 15,
    sort = "updated",
    direction = "desc",
  } = req.query;

  try {
    // GitHub API pagination parameters
    const githubParams = {
      page: parseInt(page),
      per_page: Math.min(parseInt(limit), 100), // GitHub max is 100
      sort: sort,
      direction: direction,
    };

    const response = await axios.get("https://api.github.com/user/repos", {
      headers: { Authorization: `Bearer ${user.token}` },
      params: githubParams,
    });

    const ownedRepos = response.data.filter(
      (repo) => repo.owner.login === user.username
    );

    // Get total count from headers (if available) or estimate
    const linkHeader = response.headers.link;
    let totalCount = ownedRepos.length;

    console.log("Link header debug (fixed regex):", {
      linkHeader,
      hasLast: linkHeader && linkHeader.includes('rel="last"'),
      ownedReposLength: ownedRepos.length,
      githubParamsPerPage: githubParams.per_page,
    });

    if (linkHeader && linkHeader.includes('rel="last"')) {
      // Find the link with rel="last" and extract page number
      const lastLinkMatch = linkHeader.match(
        /<[^>]*[?&]page=(\d+)[^>]*>;\s*rel="last"/
      );
      const lastPageMatch = lastLinkMatch;
      console.log("Last page regex debug:", {
        linkHeader,
        lastLinkMatch,
        extractedPage: lastLinkMatch ? lastLinkMatch[1] : "no match",
      });
      if (lastPageMatch) {
        const lastPage = parseInt(lastPageMatch[1]);
        const calculatedTotal =
          (lastPage - 1) * githubParams.per_page + ownedRepos.length;
        console.log("Total count calculation:", {
          lastPage,
          perPage: githubParams.per_page,
          ownedRepos: ownedRepos.length,
          calculatedTotal,
        });
        totalCount = calculatedTotal;
      }
    }

    console.log("Final totalCount:", totalCount);

    // Fallback: ensure totalCount is never 0 if we have repositories
    if (totalCount === 0 && ownedRepos.length > 0) {
      totalCount = ownedRepos.length;
      console.log("Applied fallback totalCount:", totalCount);
    }

    const paginationInfo = {
      currentPage: parseInt(page),
      totalPages: Math.ceil(totalCount / githubParams.per_page),
      totalCount: totalCount,
      hasNextPage:
        response.headers.link && response.headers.link.includes('rel="next"'),
      hasPrevPage: parseInt(page) > 1,
    };

    res.json({
      repositories: ownedRepos,
      pagination: paginationInfo,
    });
  } catch (err) {
    console.error("Error fetching repositories:", err);
    res.status(500).json({ message: "Error fetching repositories" });
  }
};

// Get filtered repositories based on type with pagination
const getFilteredRepos = async (req, res) => {
  const user = await User.findById(req.user);
  const { filter } = req.params;
  const {
    page = 1,
    limit = 15,
    sort = "updated",
    direction = "desc",
  } = req.query;

  // If filter is "all", redirect to listRepos logic
  if (filter === "all") {
    return listRepos(req, res);
  }

  try {
    // GitHub API pagination parameters
    const githubParams = {
      page: parseInt(page),
      per_page: Math.min(parseInt(limit), 100), // GitHub max is 100
      sort: sort,
      direction: direction,
    };

    let response;
    let allRepos;
    let totalCount = 0;
    let linkHeader;

    if (filter === "starred") {
      // For starred repos, use different endpoint
      response = await axios.get("https://api.github.com/user/starred", {
        headers: { Authorization: `Bearer ${user.token}` },
        params: githubParams,
      });
      allRepos = response.data;
      linkHeader = response.headers.link;
    } else {
      // For owned repos, get from user repos endpoint
      response = await axios.get("https://api.github.com/user/repos", {
        headers: { Authorization: `Bearer ${user.token}` },
        params: githubParams,
      });

      const ownedRepos = response.data.filter(
        (repo) => repo.owner.login === user.username
      );

      // Apply client-side filtering for specific types
      switch (filter) {
        case "active":
          const sixMonthsAgo = new Date();
          sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
          allRepos = ownedRepos.filter(
            (repo) => !repo.archived && new Date(repo.pushed_at) > sixMonthsAgo
          );
          break;
        case "archived":
          allRepos = ownedRepos.filter((repo) => repo.archived);
          break;
        case "forked":
          allRepos = ownedRepos.filter((repo) => repo.fork);
          break;
        case "private":
          allRepos = ownedRepos.filter((repo) => repo.private);
          break;
        case "public":
          allRepos = ownedRepos.filter((repo) => !repo.private);
          break;
        default:
          allRepos = ownedRepos;
      }
      linkHeader = response.headers.link;
    }

    // Calculate pagination info
    if (filter === "starred") {
      // For starred repos, use GitHub's pagination directly
      if (linkHeader && linkHeader.includes('rel="last"')) {
        // Find the link with rel="last" and extract page number
        const lastLinkMatch = linkHeader.match(
          /<[^>]*[?&]page=(\d+)[^>]*>;\s*rel="last"/
        );
        const lastPageMatch = lastLinkMatch;
        if (lastPageMatch) {
          const lastPage = parseInt(lastPageMatch[1]);
          totalCount = (lastPage - 1) * githubParams.per_page + allRepos.length;
        }
      } else {
        totalCount = allRepos.length;
      }
    } else {
      // For owned repos (including "all"), use the same logic as listRepos
      if (linkHeader && linkHeader.includes('rel="last"')) {
        // Find the link with rel="last" and extract page number
        const lastLinkMatch = linkHeader.match(
          /<[^>]*[?&]page=(\d+)[^>]*>;\s*rel="last"/
        );
        const lastPageMatch = lastLinkMatch;
        if (lastPageMatch) {
          const lastPage = parseInt(lastPageMatch[1]);
          // Calculate total based on filtered repos from GitHub response
          const unfilteredReposOnPage = response.data.length;
          totalCount =
            (lastPage - 1) * githubParams.per_page + unfilteredReposOnPage;
        }
      } else {
        // No pagination needed, use the actual owned repos length
        totalCount = response.data.filter(
          (repo) => repo.owner.login === user.username
        ).length;
      }

      // Fallback: ensure totalCount is never 0 if we have repositories
      if (totalCount === 0 && allRepos.length > 0) {
        totalCount = allRepos.length;
      }
    }

    // For client-side filtered results, we need to handle pagination differently
    const isClientFiltered = [
      "active",
      "archived",
      "forked",
      "private",
      "public",
    ].includes(filter);
    let paginatedRepos = allRepos;

    if (isClientFiltered) {
      // For client-side filtering, we apply pagination after filtering
      const filteredTotalCount = allRepos.length;
      const startIndex = (parseInt(page) - 1) * parseInt(limit);
      const endIndex = startIndex + parseInt(limit);
      paginatedRepos = allRepos.slice(startIndex, endIndex);
      totalCount = filteredTotalCount;
    }

    const paginationInfo = {
      currentPage: parseInt(page),
      totalPages: Math.ceil(totalCount / parseInt(limit)),
      totalCount: totalCount,
      hasNextPage: isClientFiltered
        ? parseInt(page) * parseInt(limit) < totalCount
        : linkHeader && linkHeader.includes('rel="next"'),
      hasPrevPage: parseInt(page) > 1,
    };

    console.log("Pagination Debug:", {
      filter,
      isClientFiltered,
      allRepos: allRepos.length,
      paginatedRepos: paginatedRepos.length,
      totalCount,
      linkHeader: linkHeader ? "exists" : "none",
      linkHeaderContent: linkHeader,
      responseDataLength: response.data.length,
      ownedReposLength: response.data.filter(
        (repo) => repo.owner.login === user.username
      ).length,
      paginationInfo,
    });

    res.json({
      repositories: paginatedRepos,
      pagination: paginationInfo,
    });
  } catch (err) {
    console.error("Error fetching filtered repositories:", err);
    res.status(500).json({ message: "Error fetching filtered repositories" });
  }
};

/**
 * Get repository statistics
 */
const getRepositoryStats = async (req, res) => {
  try {
    const user = await User.findById(req.user);
    const response = await axios.get("https://api.github.com/user/repos", {
      headers: { Authorization: `Bearer ${user.token}` },
    });

    const ownedRepos = response.data.filter(
      (repo) => repo.owner.login === user.username
    );

    const stats = {
      total: ownedRepos.length,
      public: ownedRepos.filter((repo) => !repo.private).length,
      private: ownedRepos.filter((repo) => repo.private).length,
      forked: ownedRepos.filter((repo) => repo.fork).length,
      archived: ownedRepos.filter((repo) => repo.archived).length,
      totalStars: ownedRepos.reduce(
        (sum, repo) => sum + repo.stargazers_count,
        0
      ),
      totalForks: ownedRepos.reduce((sum, repo) => sum + repo.forks_count, 0),
    };

    res.json(stats);
  } catch (error) {
    console.error("Error fetching repository statistics:", error);
    res.status(500).json({ message: "Error fetching repository statistics" });
  }
};

/**
 * Get pull requests count across all repositories
 */
const getPullRequestsCount = async (req, res) => {
  try {
    const user = await User.findById(req.user);
    const response = await axios.get("https://api.github.com/user/repos", {
      headers: { Authorization: `Bearer ${user.token}` },
    });

    const ownedRepos = response.data.filter(
      (repo) => repo.owner.login === user.username
    );

    let totalOpenPRs = 0;

    // Get open pull requests for each repository
    for (const repo of ownedRepos) {
      try {
        const prResponse = await axios.get(
          `https://api.github.com/repos/${repo.full_name}/pulls?state=open`,
          {
            headers: { Authorization: `Bearer ${user.token}` },
          }
        );
        totalOpenPRs += prResponse.data.length;
      } catch (prError) {
        // Continue if a single repo fails (might be private/no access)
        console.warn(
          `Failed to fetch PRs for ${repo.full_name}:`,
          prError.message
        );
      }
    }

    res.json({
      totalOpenPRs,
      repositories: ownedRepos.length,
    });
  } catch (error) {
    console.error("Error fetching pull requests count:", error);
    res.status(500).json({ message: "Error fetching pull requests count" });
  }
};

/**
 * Get starred repositories count
 */
const getStarredRepositoriesCount = async (req, res) => {
  try {
    const user = await User.findById(req.user);

    // Get starred repositories count from GitHub API
    const response = await axios.get("https://api.github.com/user/starred", {
      headers: {
        Authorization: `Bearer ${user.token}`,
        "X-GitHub-Api-Version": "2022-11-28",
        Accept: "application/vnd.github+json",
      },
    });

    // Get total count from Link header if available
    let totalStarred = 0;
    const linkHeader = response.headers.link;

    if (linkHeader && linkHeader.includes('rel="last"')) {
      const lastPageMatch = linkHeader.match(/page=(\d+)>; rel="last"/);
      if (lastPageMatch) {
        totalStarred = parseInt(lastPageMatch[1]);
      }
    } else {
      // If no pagination, the actual count is the length of returned data
      const fullResponse = await axios.get(
        "https://api.github.com/user/starred",
        {
          headers: {
            Authorization: `Bearer ${user.token}`,
            "X-GitHub-Api-Version": "2022-11-28",
            Accept: "application/vnd.github+json",
          },
        }
      );
      totalStarred = fullResponse.data.length;
    }

    res.json({
      totalStarred,
      message: "Starred repositories count fetched successfully",
    });
  } catch (error) {
    console.error("Error fetching starred repositories count:", error);
    res
      .status(500)
      .json({ message: "Error fetching starred repositories count" });
  }
};

/**
 * Get repository details by owner and name
 */
const getRepositoryDetails = async (req, res) => {
  try {
    const user = await User.findById(req.user);
    const { owner, name } = req.params;
    
    const response = await axios.get(`https://api.github.com/repos/${owner}/${name}`, {
      headers: { Authorization: `Bearer ${user.token}` },
    });

    res.json(response.data);
  } catch (error) {
    console.error("Error fetching repository details:", error);
    res.status(500).json({ message: "Error fetching repository details" });
  }
};

/**
 * Get repository commits
 */
const getRepositoryCommits = async (req, res) => {
  try {
    const user = await User.findById(req.user);
    const { owner, name } = req.params;
    const { page = 1, per_page = 10 } = req.query;
    
    const response = await axios.get(`https://api.github.com/repos/${owner}/${name}/commits`, {
      headers: { Authorization: `Bearer ${user.token}` },
      params: { page: parseInt(page), per_page: parseInt(per_page) }
    });

    res.json(response.data);
  } catch (error) {
    console.error("Error fetching repository commits:", error);
    res.status(500).json({ message: "Error fetching repository commits" });
  }
};

/**
 * Get repository pull requests
 */
const getRepositoryPullRequests = async (req, res) => {
  try {
    const user = await User.findById(req.user);
    const { owner, name } = req.params;
    const { state = 'all', page = 1, per_page = 10 } = req.query;
    
    const response = await axios.get(`https://api.github.com/repos/${owner}/${name}/pulls`, {
      headers: { Authorization: `Bearer ${user.token}` },
      params: { state, page: parseInt(page), per_page: parseInt(per_page) }
    });

    res.json(response.data);
  } catch (error) {
    console.error("Error fetching repository pull requests:", error);
    res.status(500).json({ message: "Error fetching repository pull requests" });
  }
};

/**
 * Get repository collaborators
 */
const getRepositoryCollaborators = async (req, res) => {
  try {
    const user = await User.findById(req.user);
    const { owner, name } = req.params;
    
    const response = await axios.get(`https://api.github.com/repos/${owner}/${name}/collaborators`, {
      headers: { Authorization: `Bearer ${user.token}` },
    });

    res.json(response.data);
  } catch (error) {
    console.error("Error fetching repository collaborators:", error);
    res.status(500).json({ message: "Error fetching repository collaborators" });
  }
};

/**
 * Get repository README
 */
const getRepositoryReadme = async (req, res) => {
  try {
    const user = await User.findById(req.user);
    const { owner, name } = req.params;
    
    const response = await axios.get(`https://api.github.com/repos/${owner}/${name}/readme`, {
      headers: { Authorization: `Bearer ${user.token}` },
    });

    // Decode base64 content
    const readmeContent = Buffer.from(response.data.content, 'base64').toString('utf8');
    
    res.json({
      ...response.data,
      decoded_content: readmeContent
    });
  } catch (error) {
    console.error("Error fetching repository README:", error);
    res.status(500).json({ message: "Error fetching repository README" });
  }
};

module.exports = {
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
};
