const { GoogleGenerativeAI } = require("@google/generative-ai");

const GOOGLE_GEMINI_API_KEY = process.env.GOOGLE_GEMINI_API_KEY;

const generateSummary = async ({
  difference_code,
  pull_request_title,
  changed_files,
  additions,
  deleted,
  commits_description,
}) => {
  const prompt = `
    Generate a summary for github pull request based on the following elements:
    DifferenceCode: ${difference_code}
    pullRequestTitle: ${pull_request_title}
    changedFiles: ${changed_files}
    additions: ${additions}
    deletions: ${deleted}
    commitsDescription: ${commits_description}

    Explain the changes in all files, focusing on what was added, removed, or modified and how these changes might affect the project."

    Write a summary that includes these elements in a smooth and engaging way. The summary should be written in simple language, as if you are telling it to a child. It should have at least 2 parts consisting of "Summary of each file" and "Impact on the overall project" and should not include a themes, mood, sentiment, tone, or mention of AI content. Just focus on conveying the summary.
  `;

  try {
    const genAI = new GoogleGenerativeAI(GOOGLE_GEMINI_API_KEY);

    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash",
    });
    const result = await model?.generateContent(prompt);
    const response = result?.response;
    const text = response.text();

    return [text, null];
  } catch (error) {
    console.error("Error generating poem/story from Gemini:", error);
    return [null, error];
  }
};

module.exports = {
  generateSummary,
};
