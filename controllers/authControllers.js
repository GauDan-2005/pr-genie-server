const User = require("../db/models/user");
const JWTService = require("../utils/jwt");

const authControllers = {
  register: async (accessToken, profile, done) => {
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
        await user.save();
      } else {
        user.token = accessToken;
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
