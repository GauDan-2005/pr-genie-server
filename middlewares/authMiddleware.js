// authMiddleware.js
const ensureAuthenticated = async (req, res, next) => {
  console.log("user demand - authentication middleware");
  // console.log(await req.isAuthenticated());
  if (req.isAuthenticated()) {
    console.log("User Authenticated");
    return next();
  }
  return res.send("Not logged in, Please log in again.");
};

module.exports = ensureAuthenticated;
