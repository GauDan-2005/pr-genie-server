const passport = require("passport");
const GitHubStrategy = require("passport-github2").Strategy;
const User = require("../db/models/user");

// Serialize and Deserialize user to maintain sessions
passport.serializeUser((user, done) => done(null, user));
passport.deserializeUser(async (user, done) => done(null, user));

// GitHub OAuth strategy
passport.use(
  new GitHubStrategy(
    {
      clientID: process.env.GITHUB_CLIENT_ID,
      clientSecret: process.env.GITHUB_CLIENT_SECRET,
      callbackURL: process.env.GITHUB_CALLBACK_URL_LOCAL,
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        // Check if user already exists
        let user = await User.findOne({ githubId: profile.id });
        if (!user) {
          user = new User({
            githubId: profile.id,
            username: profile.username,
            token: accessToken,
            name: profile.displayName,
            avatarUrl: profile.photos[0].value,
            profileUrl: profile.profileUrl,
            publicRepos: profile._json.public_repos,
          });
          // await user.save();
        } else {
          user.token = accessToken;
          // await user.save();
        }
        return done(null, user);
      } catch (err) {
        return done(err, false);
      }
    }
  )
);
