import { useState } from "react";
import type { GithubTokenState } from "../hooks/useGithubToken";

const CREATE_TOKEN_URL = "https://github.com/settings/personal-access-tokens/new";

/**
 * Optional GitHub personal access token, collapsed by default. A token raises
 * the rate limit from 60 to 5,000 requests an hour and unlocks private repos.
 */
export function TokenField({
  tokenState: t,
  disabled = false,
}: Readonly<{ tokenState: GithubTokenState; disabled?: boolean }>) {
  const [visible, setVisible] = useState(false);

  return (
    <details className="group">
      <summary className="focus-ring inline-flex cursor-pointer list-none items-center gap-2 rounded-sm text-muted text-sm hover:text-ink [&::-webkit-details-marker]:hidden">
        <svg
          viewBox="0 0 16 16"
          width="12"
          height="12"
          aria-hidden="true"
          fill="currentColor"
          className="transition-transform group-open:rotate-90 motion-reduce:transition-none"
        >
          <path d="M6 3.5 10.5 8 6 12.5 5 11.5 8.5 8 5 4.5Z" />
        </svg>
        GitHub access token (optional)
        {t.token && (
          <span className="rounded-full bg-level-1 px-2 py-0.5 font-semibold text-ink text-xs">
            Added
          </span>
        )}
      </summary>

      <div className="mt-4 flex max-w-xl flex-col gap-3">
        <p className="text-muted text-sm leading-relaxed">
          Raises GitHub&apos;s limit from 60 to 5,000 requests an hour, and lets
          you generate READMEs for private repositories the token can read.
        </p>

        <label htmlFor="github-token" className="font-semibold text-sm">
          Personal Access Token
        </label>
        <div className="flex flex-wrap items-end gap-x-4 gap-y-2">
          <input
            id="github-token"
            type={visible ? "text" : "password"}
            autoComplete="off"
            spellCheck={false}
            value={t.token}
            onChange={(e) => t.setToken(e.target.value)}
            placeholder="github_pat_..."
            disabled={disabled}
            aria-describedby="github-token-help"
            className="rounded-sm h-11 min-w-0 flex-1 basis-64 border-rule border-b-2 bg-transparent font-readme text-ink text-sm placeholder:text-faint focus:border-link focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-link disabled:text-muted"
          />
          <div className="flex gap-4">
            <button
              type="button"
              onClick={() => setVisible((v) => !v)}
              aria-pressed={visible}
              disabled={!t.token}
              className="focus-ring min-h-11 text-sm underline underline-offset-4 disabled:cursor-not-allowed disabled:text-faint disabled:no-underline"
            >
              {visible ? "Hide" : "Show"}
            </button>
            <button
              type="button"
              onClick={t.clearToken}
              disabled={!t.token}
              className="focus-ring min-h-11 text-sm underline underline-offset-4 disabled:cursor-not-allowed disabled:text-faint disabled:no-underline"
            >
              Clear
            </button>
          </div>
        </div>

        <label className="flex min-h-11 cursor-pointer items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={t.remember}
            onChange={(e) => t.setRemember(e.target.checked)}
            className="focus-ring h-4 w-4 cursor-pointer accent-primary"
          />
          Remember on this device
        </label>

        <div id="github-token-help" className="flex flex-col gap-1.5 text-faint text-xs leading-relaxed">
          <p>
            The token is sent only to api.github.com.{" "}
            {t.remember
              ? "It's saved in this browser until you clear it, so only use this on a device you trust."
              : "It's forgotten when you reload or close the page."}
          </p>
          <p>
            <a
              href={CREATE_TOKEN_URL}
              target="_blank"
              rel="noreferrer"
              className="focus-ring rounded-sm text-link underline underline-offset-2"
            >
              Create a fine-grained token
            </a>{" "}
            with read-only access to <strong className="text-muted">Contents</strong> and{" "}
            <strong className="text-muted">Metadata</strong>. Public repositories need no
            extra permissions.
          </p>
        </div>
      </div>
    </details>
  );
}
