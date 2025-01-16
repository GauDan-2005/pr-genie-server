require("dotenv").config();

const express = require("express");
const session = require("express-session");
const connectDB = require("./db/config/db");
const cors = require("cors");
// require("./config/passportConfig");
const { PassportOAuth } = require("./utils/passport");
const GitHubStrategy = require("./utils/GithubStrategy");

// DB Connection
connectDB();

const app = express();
app.use(express.json());

const allowedOrigins = [
  process.env.CLIENT_URL,
  "https://github.com",
  "https://prgenie.netlify.app",
  "http://localhost:5173",
];
const corsOptions = {
  origin: allowedOrigins,
  methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
  credentials: true,
};
app.use(cors(corsOptions));

// app.options("*", cors());

// Session Middleware
app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
  })
);

// Initialize Passport
app.use(PassportOAuth.initialize());
app.use(PassportOAuth.session());

PassportOAuth.use(GitHubStrategy);

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
