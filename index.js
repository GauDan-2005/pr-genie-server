require("dotenv").config();

const express = require("express");
const passport = require("passport");
const session = require("express-session");
const connectDB = require("./db/config/db");
const cors = require("cors");
require("./config/passportConfig");

// DB Connection
connectDB();

const app = express();
app.use(express.json());

const allowedOrigins = [process.env.CLIENT_URL, "https://github.com"];
const corsOptions = {
  origin: function (origin, callback) {
    // Check if origin is in the allowed list or matches a specific pattern
    if (
      !origin ||
      allowedOrigins.some((allowed) => origin.startsWith(allowed))
    ) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true,
};
app.use(cors(corsOptions));

// Session Middleware
app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: true,
    cookie: {
      secure: false,
      // sameSite: "none",
      httpOnly: true,
      maxAge: 10 * 24 * 60 * 60 * 1000, // 10 days
    },
  })
);

// Initialize Passport
app.use(passport.initialize());
app.use(passport.session());

// Routes
app.use((req, res, next) => {
  console.log(`Incoming request: ${req.method} ${req.url}`);
  next();
});

app.use("/auth", require("./routes/auth"));
app.use("/webhooks", require("./routes/webhook"));
app.use("/user", require("./routes/user"));

// Start the server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server started on port ${PORT}`));
