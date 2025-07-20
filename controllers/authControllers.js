const User = require("../db/models/user");
const JWTService = require("../utils/jwt");

const authControllers = {
  register: async (accessToken, profile, done) => {
    try {
      console.log(profile);

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
          followers: profile._json.followers,
          following: profile._json.following,
        });
        await user.save();
      } else {
        user.githubId = profile.id;
        user.username = profile.username;
        user.token = accessToken;
        user.name = profile.displayName;
        user.avatarUrl = profile.photos[0].value;
        user.profileUrl = profile.profileUrl;
        user.publicRepos = profile._json.public_repos;
        user.followers = profile._json.followers;
        user.following = profile._json.following;

        await user.save();
      }
      const token = JWTService.generateToken({ userId: user._id });
      console.log(token, user._id);
      return done(null, token);
    } catch (err) {
      return done(err, false);
    }
  },
  verify: async (req, res, next) => {
    try {
      const authToken = req.headers["authorization"] || "";

      if (!authToken || !authToken.startsWith("Bearer ")) {
        throw new Error("please login first");
      }
      const token = authToken.split(" ")[1];
      if (!token) {
        throw new Error("please provide valid token");
      }

      const payload = JWTService.verifyToken(token, "userId");

      req.user = payload;
      next();
    } catch (error) {
      next(new Error(error.message));
    }
  },
};

module.exports = authControllers;
