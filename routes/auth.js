const express = require("express");
const router = express.Router();
const passport = require("passport");

router.get(
  "/github",
  passport.authenticate("github", { scope: ["user:email"] })
);

router.get(
  "/github/callback",
  passport.authenticate("github", {
    failureRedirect: "/",
  }),
  (req, res) => {
    res.redirect(`/dashboard`);
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
      res.redirect(`${process.env.FRONTEND_URL}/`);
    });
  });
});

module.exports = router;
