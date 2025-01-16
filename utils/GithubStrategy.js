const authControllers = require("../controllers/authControllers");

const GitHubStrat = require("passport-github2").Strategy;

const GitHubStrategy = new GitHubStrat(
  {
    clientID: process.env.GITHUB_CLIENT_ID,
    clientSecret: process.env.GITHUB_CLIENT_SECRET,
    callbackURL: process.env.GITHUB_CALLBACK_URL_LOCAL,
  },
  async (accessToken, refreshToken, profile, done) => {
    authControllers.register(accessToken, profile, done);
  }
);

module.exports = GitHubStrategy;
