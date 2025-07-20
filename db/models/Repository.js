const mongoose = require("mongoose");

const repositorySchema = new mongoose.Schema({
  repoName: { type: String, required: true },
  repoId: { type: String, required: true },
  repoUrl: { type: String, required: true },
  comment: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Comment",
    },
  ],
  webhookId: { type: String },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Repository", repositorySchema);
