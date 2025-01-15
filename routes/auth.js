const express = require("express");
const router = express.Router();
const passport = require("passport");
const ensureAuthenticated = require("../middlewares/authMiddleware");

router.get(
  "/github",
  passport.authenticate("github", {
    scope: ["user:email", "repo", "admin:repo_hook"],
  })
);

router.get(
  "/github/callback",
  passport.authenticate("github", { failureRedirect: "/" }),
  async (req, res) => {
    // Authentication successful
    console.log("calback: ", req.user);

    if (req.user) {
      res
        .status(200)
        .redirect(
          `${
            process.env.CLIENT_URL || "https://prgenie.netlify.app/login"
          }/dashboard`
        );
    } else {
      res.status(401).redirect(`${process.env.CLIENT_URL}/login`);
    }
  }
);

router.get("/user", ensureAuthenticated, async (req, res) => {
  if (req.user) {
    console.log(req.user);
    res.status(200).json(req.user);
  } else {
    res.status(401).json("Cookies not found");
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
