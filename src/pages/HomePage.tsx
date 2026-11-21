import { ContributionGrid } from "../components/ContributionGrid";
import { ExampleRepos } from "../components/ExampleRepos";
import { RepoCommits } from "../components/RepoCommits";
import { ReadmeSheet } from "../components/ReadmeSheet";
import { RepoForm } from "../components/RepoForm";
import { StatusText } from "../components/StatusText";
import { ThemeSwitch } from "../components/ThemeSwitch";
import { TokenField } from "../components/TokenField";
import { RepoFacts } from "../components/RepoFacts";
import { SummaryBlock } from "../components/SummaryBlock";
import type { CommitActivity } from "../hooks/useCommitActivity";
import type { GithubTokenState } from "../hooks/useGithubToken";
import { useMediaQuery } from "../hooks/useMediaQuery";
import type { ReadmeGenerator } from "../hooks/useReadmeGenerator";
import type { ReadmeVersions } from "../hooks/useReadmeVersions";
import type { RepoAi } from "../hooks/useRepoAi";
import type { Theme } from "../hooks/useTheme";
import type { RecentCommit } from "../services/github";

/** Dotted grid behind the hero, fading out toward the contribution band. */
const DOT_GRID = {
  backgroundImage:
    "radial-gradient(circle, var(--color-line) 1.2px, transparent 1.6px)",
  backgroundSize: "22px 22px",
  maskImage: "linear-gradient(to bottom, black 40%, transparent)",
  WebkitMaskImage: "linear-gradient(to bottom, black 40%, transparent)",
};

/** What the commit grid is showing, in words. */
function activityCaption(activity: CommitActivity, weeks: number): string {
  if (activity.status === "loading") return "Loading commit activity...";
  if (activity.status !== "ready") return "GitHub hasn't calculated commit activity for this repository yet. Generate again in a minute.";
  const commits = activity.weeks.slice(-weeks).reduce((sum, w) => sum + w.total, 0);
  return `${commits.toLocaleString()} commit${commits === 1 ? "" : "s"} in the last ${weeks > 40 ? "year" : "6 months"}, one square per day.`;
}

interface HomePageProps {
  tokenState: GithubTokenState;
  generator: ReadmeGenerator;
  ai: RepoAi;
  versions: ReadmeVersions;
  activity: CommitActivity;
  commits: RecentCommit[];
  geminiKey: string;
  setGeminiKey: (key: string) => void;
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

export function HomePage({ tokenState, generator, ai, versions, activity, commits, geminiKey, setGeminiKey, theme, setTheme }: Readonly<HomePageProps>) {
  // A full year of weeks from the sm breakpoint up, half a year on phones.
  const weeks = useMediaQuery("(min-width: 640px)") ? 53 : 26;
  // The commit graph sits above the README on small screens, so keep it short there.
  const isDesktop = useMediaQuery("(min-width: 1024px)");
  const visibleCommits = commits.slice(0, isDesktop ? 15 : 5);

  return (
    <div className={`relative min-h-screen overflow-x-clip ${generator.status === "success" ? "pb-12" : "pb-4"}`}>
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-190"
        style={DOT_GRID}
      />

      <main className="relative mx-auto flex max-w-310 flex-col gap-12 px-4 pt-6 sm:px-8 lg:gap-16">
        <div className="-mb-4 flex items-center justify-end lg:-mb-12">
          <ThemeSwitch theme={theme} onChange={setTheme} />
        </div>

        <div className="flex flex-col gap-10">
          {/* lg:max-w keeps the width the file-tree illustration used to take (300px + 40px gap), so the heading wraps to two lines as before. */}
          <h1 className="text-balance font-extrabold text-[clamp(3rem,8.5vw,7.5rem)] leading-[0.86] tracking-[-0.045em] lg:max-w-[calc(100%-21.25rem)]">
            README Generator
          </h1>

          <div className="flex flex-col gap-8">
            <p className="text-lg text-muted leading-relaxed">
              Paste a GitHub repository URL to generate a README and an overall AI summary of the repo.
            </p>
            <div className="flex max-w-3xl flex-col gap-5">
              <RepoForm generator={generator} />
              {generator.status !== "success" && generator.status !== "loading" && (
                <ExampleRepos generator={generator} />
              )}
              <TokenField
                tokenState={tokenState}
                disabled={generator.status === "loading"}
              />
            </div>
          </div>
        </div>

        {/* A little closer to the form than the default section gap. */}
        <div className="-mt-3 flex flex-col gap-3 lg:-mt-4">
          <ContributionGrid status={generator.status} weeks={weeks} activity={activity} />
          <StatusText generator={generator} ai={ai} />
          {generator.status === "success" && (
            <p className="text-faint text-xs">{activityCaption(activity, weeks)}</p>
          )}
        </div>

        {generator.status === "success" && (
          <SummaryBlock ai={ai} geminiKey={geminiKey} setGeminiKey={setGeminiKey} wide />
        )}

        {/* Nothing below the grid until there is a result. Row 1 is the README heading and buttons, row 2 the cards, so the README card and the stats card start on the same line. On small screens the repo info comes before the README. */}
        {generator.status === "success" && generator.snapshot && (
          <div className="grid gap-y-12 lg:grid-cols-[minmax(0,1fr)_minmax(300px,380px)] lg:grid-rows-[auto_1fr] lg:gap-x-8 lg:gap-y-0">
            {/* First in the page order so keyboard order matches the phone layout; on desktop the grid places it on the right. */}
            <div className="flex min-w-0 flex-col gap-8 lg:col-start-2 lg:row-start-2">
              <RepoFacts snapshot={generator.snapshot} />
              <div className="[@media(min-width:1024px)_and_(min-height:720px)]:sticky [@media(min-width:1024px)_and_(min-height:720px)]:top-10">
                <RepoCommits commits={visibleCommits} />
              </div>
            </div>
            <ReadmeSheet generator={generator} ai={ai} versions={versions} />
          </div>
        )}
      </main>
    </div>
  );
}
