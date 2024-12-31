import { getGithubRepoInfo } from "./src/github-utils.mjs";
import { defineConfig } from "vite";

/**
 * Gets the name of the repository.
 */
async function getRepoName(): Promise<string> {
  let repoInfo = await getGithubRepoInfo();
  if (Array.isArray(repoInfo)) {
    if (repoInfo.length < 1) {
      throw new TypeError("Repo info was an empty array.");
    }
    repoInfo = repoInfo[0];
  }
  const { repo } = repoInfo;
  return repo;
}

export default defineConfig(async (/*{command, mode, ssrBuild}*/) => {
  // Get the name of the repository.
  const repo = await getRepoName();
  return {
    // Set the URL base to the name of the repository.
    base: `/${repo}/`,
  };
});
