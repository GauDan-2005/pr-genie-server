// authMiddleware.js
const ensureAuthenticated = (req, res, next) => {
  if (req.isAuthenticated()) {
    return next();
  }
  res.redirect("/auth/github"); // Redirect to GitHub login if not authenticated
};

module.exports = ensureAuthenticated;
