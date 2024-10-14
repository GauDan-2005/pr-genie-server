const mongoose = require("mongoose");

const aiCommentSchema = new mongoose.Schema({
  repoName: { type: String, required: true },
  pullRequestId: { type: String, required: true },
  comment: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});

const userSchema = new mongoose.Schema(
  {
    githubId: { type: String, required: true, unique: true },
    username: { type: String },
    name: { type: String },
    login: { type: String },
    avatarUrl: { type: String },
    htmlUrl: { type: String },
    publicRepos: { type: Number },
    token: { type: String },
    aiComments: [aiCommentSchema],
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);
