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
app.use(cors());
// Session Middleware
app.use(
  session({
    secret: process.env.SESSION_SECRET || "your-session-secret",
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false },
  })
);

// Initialize Passport
app.use(passport.initialize());
app.use(passport.session());

// Routes
app.use("/auth", require("./routes/auth"));
app.use("/webhooks", require("./routes/webhook"));
app.use("/user", require("./routes/user"));

// Start the server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server started on port ${PORT}`));
