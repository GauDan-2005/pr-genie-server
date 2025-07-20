const User = require("../db/models/user");
const Repository = require("../db/models/Repository");

/**
 * Get AI comments with filtering and pagination
 */
const getAIComments = async (req, res) => {
  try {
    const userId = req.user.id;
    const { status, repository, type, limit = 50, offset = 0 } = req.query;
    
    // Get user's repositories to filter comments
    const user = await User.findById(req.user);
    const userRepos = await Repository.find({ 
      _id: { $in: user.repository } 
    }).populate('comment');
    
    let allComments = [];
    userRepos.forEach(repo => {
      repo.comment.forEach(comment => {
        allComments.push({
          id: comment._id,
          repositoryName: repo.repoName,
          pullRequestId: comment.pullRequestId,
          comment: comment.comment,
          branch: comment.branch,
          createdAt: comment.createdAt,
          status: 'posted', // Default status for existing comments
          type: 'summary' // Default type
        });
      });
    });
    
    // Apply filters
    if (status && status !== 'all') {
      allComments = allComments.filter(comment => comment.status === status);
    }
    if (repository) {
      allComments = allComments.filter(comment => 
        comment.repositoryName.toLowerCase().includes(repository.toLowerCase())
      );
    }
    if (type && type !== 'all') {
      allComments = allComments.filter(comment => comment.type === type);
    }
    
    // Apply pagination
    const paginatedComments = allComments
      .slice(parseInt(offset), parseInt(offset) + parseInt(limit));
    
    res.json({
      comments: paginatedComments,
      total: allComments.length,
      limit: parseInt(limit),
      offset: parseInt(offset)
    });
  } catch (error) {
    console.error("Error retrieving AI comments:", error);
    res.status(500).json({ message: "Error retrieving AI comments" });
  }
};

/**
 * Get AI comments statistics
 */
const getAICommentsStats = async (req, res) => {
  try {
    const user = await User.findById(req.user);
    const userRepos = await Repository.find({ 
      _id: { $in: user.repository } 
    }).populate('comment');
    
    let totalComments = 0;
    let recentComments = 0;
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    userRepos.forEach(repo => {
      totalComments += repo.comment.length;
      recentComments += repo.comment.filter(comment => 
        new Date(comment.createdAt) > thirtyDaysAgo
      ).length;
    });
    
    res.json({
      totalComments,
      recentComments,
      averagePerDay: recentComments / 30,
      repositoriesWithComments: userRepos.filter(repo => repo.comment.length > 0).length
    });
  } catch (error) {
    console.error("Error retrieving AI comments stats:", error);
    res.status(500).json({ message: "Error retrieving AI comments statistics" });
  }
};

module.exports = {
  getAIComments,
  getAICommentsStats
};