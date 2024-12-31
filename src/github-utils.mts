import { exec } from "node:child_process";
import { promisify } from "node:util";

interface RemoteMatchGroups {
  [key: string]: string;
  remote: string;
  url: string;
  direction: string;
}

interface RemoteMatch extends RegExpMatchArray {
  groups: RemoteMatchGroups;
}

/**
 * Detects if a {@link RegExpMatchArray}'s
 * {@link RegExpMatchArray.groups|groups property}
 * has the properties defined by {@link RemoteMatchGroups}
 * @param match
 * @returns Returns true if {@link match} is a
 * {@link RemoteMatch}, false otherwise.
 */
function hasExpectedGroups(match: RegExpMatchArray): match is RemoteMatch {
  const { groups } = match;
  // If the match doesn't have groups defined then it
  // is not a RemoteMatch.
  if (!groups) {
    return false;
  }
  for (const propertyName of ["remote", "url", "direction"]) {
    if (!Object.hasOwn(groups, propertyName)) {
      return false;
    }
  }
  return true;
}

export interface RepoInfo {
  owner: string;
  repo: string;
}

/**
 * Parses the owner and repo name from a GitHub URL.
 * @param url
 * @returns
 */
function parseGitHubUrl(url: string): RepoInfo {
  const githubUrlRe = /https:\/\/github\.com/i;
  if (!githubUrlRe.test(url)) {
    throw new Error(`Not a GitHub URL: ${url}`);
  }
  const parts = url
    .split(/[/]+/)
    .slice(-2)
    .map((s) => s.replace(/\.git/i, ""));
  const [owner, repo] = parts;
  return { owner, repo };
}

/**
 * Retrieves GitHub repo information by executing
 * `git remote --verbose` and parsing the response.
 * @returns Github repo information
 */
export async function getGithubRepoInfo() {
  // Execute `git remote --verbose`, then parse
  const re = /\b(?<remote>\S+)\s+(?<url>\S+)\s+\((?<direction>\S+)\)/gi;
  const result = await promisify(exec)("git remote --verbose", {
    encoding: "utf-8",
  });
  const matches = result.stdout.matchAll(re);

  const groups = [...matches]
    .filter(hasExpectedGroups)
    .map((m) => (m as RemoteMatch).groups);
  // Remove duplicate URLs.
  const urls = [...new Set(groups.map((g) => g.url))].map(parseGitHubUrl);
  console.groupEnd();
  return urls.length === 1 ? urls[0] : urls;
}
