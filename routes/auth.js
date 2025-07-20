const express = require("express");
const router = express.Router();
const ensureAuthenticated = require("../middlewares/authMiddleware");
const { PassportOAuth } = require("../utils/passport");
const { verify } = require("../controllers/authControllers");

router.get(
  "/github",
  PassportOAuth.authenticate("github", {
    scope: ["user:email", "repo", "admin:repo_hook"],
  })
);

router.get(
  "/github/callback",
  PassportOAuth.authenticate("github", {
    failureRedirect: `${process.env.SERVER_URL}/auth/failed`,
  }),
  async (req, res) => {
    // Authentication successful
    const user = req.user;
    res.redirect(`${process.env.CLIENT_URL}/success?token=${user}`);
  }
);

router.get("/logout", (req, res) => {
  req.logout((err) => {
    if (err) {
      return res
        .status(500)
        .json({ error: "Could not log out, please try again" });
    }
    req.session.destroy((err) => {
      if (err) {
        console.error("Error destroying session:", err);
      }
      res.clearCookie("connect.sid");
      res.status(200).json({ message: "Logged out successfully." });
    });
  });
});

router.get("/failed", (req, res) => {
  res.status(500).json({ message: "Failed to authenticate" });
});

router.get("/success", (req, res) => {
  res.status(200).json({ message: "Successfuly authenticated" });
});

module.exports = router;
