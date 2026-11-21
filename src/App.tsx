import { useState } from "react";
import { useCommitActivity } from "./hooks/useCommitActivity";
import { useGithubToken } from "./hooks/useGithubToken";
import { useRecentCommits } from "./hooks/useRecentCommits";
import { useReadmeGenerator } from "./hooks/useReadmeGenerator";
import { useReadmeVersions } from "./hooks/useReadmeVersions";
import { useRepoAi } from "./hooks/useRepoAi";
import { useTheme } from "./hooks/useTheme";
import { HomePage } from "./pages/HomePage";

export default function App() {
  const tokenState = useGithubToken();
  const generator = useReadmeGenerator(tokenState.token);
  const [geminiKey, setGeminiKey] = useState("");
  const ai = useRepoAi(generator.snapshot, tokenState.token, geminiKey);
  const activity = useCommitActivity(generator.snapshot, tokenState.token);
  const commits = useRecentCommits(generator.snapshot, tokenState.token);
  const versions = useReadmeVersions(generator, ai);
  const [theme, setTheme] = useTheme();

  return (
    <HomePage
      {...{ tokenState, generator, ai, versions, activity, commits, geminiKey, setGeminiKey, theme, setTheme }}
    />
  );
}
