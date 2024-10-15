const express = require("express");
const router = express.Router();
const passport = require("passport");
const cors = require("cors");
const corsOptions = {
  origin: process.env.CLIENT_URL, // Allow your frontend origin
  credentials: true, // Allow credentials (cookies)
};

router.get(
  "/github",
  passport.authenticate("github", {
    scope: ["user:email", "repo", "admin:repo_hook"],
  })
);

router.get("/github/callback", async (req, res) => {
  const code = req.query.code;
  try {
    const tokenResponse = await axios.post(
      "https://github.com/login/oauth/access_token",
      {
        client_id: process.env.GITHUB_CLIENT_ID,
        client_secret: process.env.GITHUB_CLIENT_SECRET,
        code: code,
      },
      {
        headers: { Accept: "application/json" },
      }
    );

    const accessToken = tokenResponse.data.access_token;

    res.status(200).redirect("/dashboard");
  } catch (error) {
    res.status(500).send("Authentication failed");
  }
});

router.get("/user", (req, res) => {
  if (req.user) {
    res.json({ user: req.user });
  } else {
    res.status(401).json({ error: "Not authenticated" });
  }
});

router.get("/logout", cors(corsOptions), (req, res) => {
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

module.exports = router;
