Here's a sample `README.md` file for your backend repository:

---

# PR Genie - Backend

PR Genie is a web application that automates the GitHub Pull Request (PR) review process using AI. This repository contains the backend code responsible for handling authentication, webhooks, and AI-powered PR review functionality.

## Features

- **GitHub OAuth Integration**: Authenticate users using GitHub OAuth.
- **Webhook Handling**: Automatically trigger actions when a pull request is opened.
- **AI-Powered Review**: Generate reviews for PRs using an integrated AI model.
- **Task Management API**: Manage tasks based on PR status and priority.

## Tech Stack

- **Node.js**: JavaScript runtime for server-side development.
- **Express.js**: Web framework for building RESTful APIs.
- **MongoDB**: Database for storing user data and PR information.
- **Passport.js**: Authentication middleware for handling GitHub OAuth.
- **Axios**: HTTP client for making requests to external services.
- **Mongoose**: ODM for MongoDB.

## Project Setup

### Prerequisites

- [Node.js](https://nodejs.org/) (version 16 or higher)
- [npm](https://www.npmjs.com/) or [yarn](https://yarnpkg.com/) installed.
- [MongoDB](https://www.mongodb.com/) instance running locally or in the cloud (e.g., MongoDB Atlas).

### Installation

1. Clone the repository:

   ```bash
   git clone https://github.com/GauDan-2005/pr-genie-server.git
   ```

2. Navigate to the project directory:

   ```bash
   cd pr-genie-backend
   ```

3. Install the dependencies:

   ```bash
   npm install
   ```

4. Create a `.env` file in the root directory and add the following environment variables:

   ```bash
   CLIENT_URL=<your-frontend-url>
   MONGO_URI=<your-mongodb-connection-string>
   GITHUB_CLIENT_ID=<your-github-client-id>
   GITHUB_CLIENT_SECRET=<your-github-client-secret>
   SESSION_SECRET=<your-session-secret>
   AI_API_URL=<your-ai-model-api-endpoint>
   PORT=5000
   ```

5. Start the server:

   ```bash
   npm run dev
   ```

6. The server should now be running on `http://localhost:5000`.

### API Endpoints

#### Authentication

- **GitHub OAuth**: `GET /auth/github`
  - Redirects to GitHub for authentication.
- **OAuth Callback**: `GET /auth/github/callback`
  - Handles the OAuth callback and redirects to the frontend.
- **Check Auth Status**: `GET /auth/user`
  - Returns the authenticated user info.

#### Webhooks

- **PR Webhook**: `POST /webhooks/pr`
  - Triggered when a new PR is created. It fetches the PR data and generates an AI-based review.

#### Task Management

- **Get Tasks**: `GET /user/tasks`
  - Fetch all tasks for a user, grouped by priority and status.

### Folder Structure

```
src/
├── config/            # Configuration files (e.g., passport config)
├── controllers/       # Logic for handling API requests
├── db/                # DB related
      ├── config/  # DB configuration files
      ├── models/  # Mongoose models (User, PR, Task, etc.)
├── routes/            # Express routes
├── middlewares/       # Custom middleware (e.g., authentication)
└── services/          # Google Gemini AI service
└── app.js             # Main server file

```

### Deployment

This project is ready to be deployed on platforms like [Render](https://render.com/), [Heroku](https://www.heroku.com/), or [DigitalOcean](https://www.digitalocean.com/). When deploying, ensure that you:

- Set the correct environment variables in your hosting platform.
- Update the frontend to point to the correct backend URL.

### Contributing

Contributions are welcome! Please follow these steps to contribute:

1. Fork the repository.
2. Create a new feature branch (`git checkout -b feature-branch-name`).
3. Commit your changes (`git commit -m 'Add new feature'`).
4. Push to the branch (`git push origin feature-branch-name`).
5. Open a pull request.

### License

This project is licensed under the MIT License.
