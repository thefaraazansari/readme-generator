import { useState } from "react";

const STORAGE_KEY = "github-token";

function readSavedToken(): string {
  try {
    return localStorage.getItem(STORAGE_KEY) ?? "";
  } catch {
    return "";
  }
}

function writeSavedToken(token: string | null) {
  try {
    if (token) localStorage.setItem(STORAGE_KEY, token);
    else localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Storage blocked: the token still works for this visit.
  }
}

/**
 * A GitHub personal access token. Kept in memory by default; saved to this
 * browser's local storage only when the person chooses "remember".
 */
export function useGithubToken() {
  const [token, setTokenState] = useState(readSavedToken);
  const [remember, setRememberState] = useState(() => readSavedToken() !== "");

  const setToken = (value: string) => {
    const next = value.trim();
    setTokenState(next);
    if (remember) writeSavedToken(next || null);
  };

  const setRemember = (value: boolean) => {
    setRememberState(value);
    writeSavedToken(value ? token || null : null);
  };

  const clearToken = () => {
    setTokenState("");
    writeSavedToken(null);
  };

  return { token, setToken, remember, setRemember, clearToken };
}

export type GithubTokenState = ReturnType<typeof useGithubToken>;
