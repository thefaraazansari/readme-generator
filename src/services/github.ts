const GITHUB_API_BASE = "https://api.github.com";

/**
 * A GitHub personal access token, or an empty string for anonymous requests.
 * Anonymous requests are limited to 60 an hour and can only read public repos.
 */
export type GithubToken = string;

// ----------------
// Request helpers
// ----------------

function formatResetTime(response: Response): string | null {
  const reset = Number(response.headers.get("x-ratelimit-reset"));
  if (!reset) return null;
  return new Date(reset * 1000).toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
  });
}

/** Turn a failed response into an error message that says what to do next. */
function errorFor(response: Response, token: GithubToken): Error {
  const { status } = response;

  if (status === 401) {
    return new Error(
      "GitHub rejected the access token. Check that it's copied correctly and hasn't expired or been revoked.",
    );
  }

  const rateLimited =
    status === 429 ||
    (status === 403 && response.headers.get("x-ratelimit-remaining") === "0");
  if (rateLimited) {
    const resetAt = formatResetTime(response);
    const retry = resetAt ? `Try again after ${resetAt}` : "Try again later";
    return new Error(
      token
        ? `GitHub's rate limit for this token is used up. ${retry}.`
        : `GitHub's limit of 60 requests an hour is used up. Add an access token to keep going, or ${retry.toLowerCase()}.`,
    );
  }

  if (status === 403) {
    return new Error(
      token
        ? "This access token doesn't have permission to read this repository."
        : "GitHub refused the request. Try again in a few minutes.",
    );
  }

  return new Error(`GitHub API error: ${status}`);
}

/**
 * GET a GitHub API path. Returns null for 404 when `allowNotFound` is set
 * (a missing file is an expected outcome); throws a readable error otherwise.
 */
async function githubGet<T>(
  path: string,
  token: GithubToken,
  { allowNotFound = false } = {},
): Promise<T | null> {
  const headers: Record<string, string> = {
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
  };
  if (token) headers.Authorization = `Bearer ${token}`;

  const response = await fetch(`${GITHUB_API_BASE}${path}`, { headers });

  if (response.status === 404 && allowNotFound) return null;
  if (!response.ok) throw errorFor(response, token);

  return response.json() as Promise<T>;
}

/** Decode GitHub's base64 file content as UTF-8 (atob alone garbles non-ASCII). */
function decodeBase64(content: string): string {
  const binary = atob(content.replaceAll("\n", ""));
  const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

// ------------------------
// To get the repo metadata
// ------------------------

export interface RepoMetadata {
  name: string;
  fullName: string;
  description: string | null;
  htmlUrl: string;
  defaultBranch: string;
  license: string | null;
  stargazersCount: number;
  topics: string[];
  /** Private repos can only be read with a token that has access to them. */
  isPrivate: boolean;
}

interface RepoResponse {
  name: string;
  full_name: string;
  description: string | null;
  html_url: string;
  default_branch: string;
  license: { name: string } | null;
  stargazers_count: number;
  topics?: string[];
  private: boolean;
}

export async function fetchRepoMetadata(
  owner: string,
  repo: string,
  token: GithubToken = "",
): Promise<RepoMetadata> {
  const data = await githubGet<RepoResponse>(`/repos/${owner}/${repo}`, token, {
    allowNotFound: true,
  });

  // GitHub answers 404, not 403, for private repos you can't see.
  if (!data) {
    throw new Error(
      token
        ? "Repository not found, or this access token can't read it. Check the URL and the token's repository access."
        : "Repository not found. Check the URL, or add an access token if the repository is private.",
    );
  }

  return {
    name: data.name,
    fullName: data.full_name,
    description: data.description,
    htmlUrl: data.html_url,
    defaultBranch: data.default_branch,
    license: data.license?.name ?? null,
    stargazersCount: data.stargazers_count,
    topics: data.topics ?? [],
    isPrivate: data.private,
  };
}

// -------------------------
// To get the repo languages
// -------------------------

export interface LanguageBreakdown {
  name: string;
  bytes: number;
  percentage: number;
}

export async function fetchLanguages(
  owner: string,
  repo: string,
  token: GithubToken = "",
): Promise<LanguageBreakdown[]> {
  const data =
    (await githubGet<Record<string, number>>(
      `/repos/${owner}/${repo}/languages`,
      token,
    )) ?? {};

  const totalBytes = Object.values(data).reduce((sum, b) => sum + b, 0);

  const languages: LanguageBreakdown[] = Object.entries(data).map(
    ([name, bytes]) => ({
      name,
      bytes,
      percentage: totalBytes > 0 ? (bytes / totalBytes) * 100 : 0,
    }),
  );

  // Sort descending so the primary language comes first
  languages.sort((a, b) => b.bytes - a.bytes);

  return languages;
}

// -------------------------
// To get the repo file tree
// -------------------------

export interface FileTreeEntry {
  path: string;
  type: "blob" | "tree"; // "blob" = file, "tree" = directory
}

interface TreeResponse {
  tree?: { path: string; type: string }[];
  truncated?: boolean;
}

export async function fetchFileTree(
  owner: string,
  repo: string,
  defaultBranch: string,
  token: GithubToken = "",
): Promise<FileTreeEntry[]> {
  const data = await githubGet<TreeResponse>(
    `/repos/${owner}/${repo}/git/trees/${defaultBranch}?recursive=1`,
    token,
  );

  if (data?.truncated) {
    console.warn(
      "File tree was truncated by GitHub (repo too large) — results may be incomplete.",
    );
  }

  return (data?.tree ?? []).map((item) => ({
    path: item.path,
    type: item.type === "tree" ? "tree" : "blob",
  }));
}

// -------------------------
// To get the existing README
// -------------------------

export interface ExistingReadme {
  content: string;
  path: string;
}

export async function fetchExistingReadme(
  owner: string,
  repo: string,
  token: GithubToken = "",
): Promise<ExistingReadme | null> {
  // No README is a valid, expected outcome, not an error.
  const data = await githubGet<{ content: string; path: string }>(
    `/repos/${owner}/${repo}/readme`,
    token,
    { allowNotFound: true },
  );
  if (!data) return null;

  return {
    content: decodeBase64(data.content),
    path: data.path,
  };
}

// -----------------------
// To get the file content
// -----------------------

export async function fetchFileContent(
  owner: string,
  repo: string,
  path: string,
  token: GithubToken = "",
): Promise<string | null> {
  const data = await githubGet<{ content?: string }>(
    `/repos/${owner}/${repo}/contents/${path}`,
    token,
    { allowNotFound: true },
  );

  return data?.content ? decodeBase64(data.content) : null;
}
