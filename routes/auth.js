const express = require("express");
const router = express.Router();
const passport = require("passport");

router.get(
  "/github",
  passport.authenticate("github", {
    scope: ["user:email", "repo", "admin:repo_hook"],
  })
);

router.get(
  "/github/callback",
  passport.authenticate("github", { failureRedirect: "/failed" }),
  async (req, res) => {
    // Authentication successful
    if (req.user) {
      res
        .status(200)
        .json({ message: "Authentication successful", user: req.user });
    } else {
      res
        .status(401)
        .json({ message: "Authentication failed, no user found." });
    }
  }
);

router.get("/user", (req, res) => {
  if (req.user) {
    res.json({ user: req.user });
  } else {
    res.status(401).json({ error: "Not authenticated" });
  }
});

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

module.exports = router;
