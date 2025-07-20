const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    githubId: { type: String, required: true, unique: true },
    username: { type: String },
    name: { type: String },
    avatarUrl: { type: String },
    htmlUrl: { type: String },
    publicRepos: { type: Number },
    token: { type: String },
    repository: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Repository",
      },
    ],
    profileUrl: { type: String },
    followers: { type: Number },
    following: { type: Number },
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);
