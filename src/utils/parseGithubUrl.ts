export interface ParsedRepo {
  owner: string;
  repo: string;
}

export interface ParsedResult {
  success: boolean;
  data?: ParsedRepo;
  error?: string;
}

export function parseGithubUrl(input: string): ParsedResult {
  const trimmed = input.trim();

  // If the trimmed input is empty
  if (!trimmed) {
    return {
      success: false,
      error: "Please enter a GitHub repository URL.",
    };
  }

  // Check if the input looks like a GitHub URL
  const githubUrlPattern =
    /^(?:https?:\/\/)?(?:www\.)?(?:github\.com\/)?([a-zA-Z0-9](?:[a-zA-Z0-9-]*[a-zA-Z0-9])?)\/([a-zA-Z0-9._-]+?)(?:\.git)?(?:\/.*)?$/;

  const match = new RegExp(githubUrlPattern).exec(trimmed);

  // If the input doesn't look like a GitHub URL
  if (!match) {
    return {
      success: false,
      error: "That doesn't look like a valid GitHub repository URL.",
    };
  }

  // Segregate the owner and repo
  const [, owner, repo] = match;

  // If the owner or repo is missing
  if (!owner || !repo) {
    return {
      success: false,
      error: "Couldn't find both an owner and repository name in that URL.",
    };
  }

  // Return the owner and repo
  return {
    success: true,
    data: {
      owner,
      repo,
    },
  };
}
