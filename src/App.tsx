import { ContributionGrid } from "./components/ContributionGrid";
import { FileTree } from "./components/FileTree";
import { GitGraph } from "./components/GitGraph";
import { ReadmeSheet } from "./components/ReadmeSheet";
import { RepoForm } from "./components/RepoForm";
import { StatusText } from "./components/StatusText";
import { ThemeSwitch } from "./components/ThemeSwitch";
import { TokenField } from "./components/TokenField";
import { useGithubToken } from "./hooks/useGithubToken";
import { useMediaQuery } from "./hooks/useMediaQuery";
import { useReadmeGenerator } from "./hooks/useReadmeGenerator";
import { useTheme } from "./hooks/useTheme";

/** Dotted grid behind the hero, fading out toward the contribution band. */
const DOT_GRID = {
  backgroundImage:
    "radial-gradient(circle, var(--color-line) 1.2px, transparent 1.6px)",
  backgroundSize: "22px 22px",
  maskImage: "linear-gradient(to bottom, black 40%, transparent)",
  WebkitMaskImage: "linear-gradient(to bottom, black 40%, transparent)",
};

export default function App() {
  const tokenState = useGithubToken();
  const generator = useReadmeGenerator(tokenState.token);
  const [theme, setTheme] = useTheme();
  // A full year of weeks from the sm breakpoint up, half a year on phones.
  const weeks = useMediaQuery("(min-width: 640px)") ? 53 : 26;

  return (
    <div className="relative min-h-screen overflow-x-clip pb-40">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-190"
        style={DOT_GRID}
      />

      <main className="relative mx-auto flex max-w-310 flex-col gap-12 px-4 pt-6 sm:px-8 lg:gap-16">
        <div className="flex justify-end">
          <ThemeSwitch theme={theme} onChange={setTheme} />
        </div>

        <div className="flex flex-col gap-10">
          <div className="flex items-end justify-between gap-10">
            <h1 className="text-balance font-extrabold text-[clamp(3rem,8.5vw,7.5rem)] leading-[0.86] tracking-[-0.045em]">
              README Generator
            </h1>
            <div aria-hidden="true" className="hidden shrink-0 lg:block">
              <FileTree generator={generator} />
            </div>
          </div>

          <div className="grid gap-8 lg:grid-cols-12 lg:gap-16">
            <p className="max-w-[34ch] text-lg text-muted leading-relaxed lg:col-span-4 lg:pt-9">
              Paste a GitHub repository URL to generate a README.
            </p>
            <div className="flex flex-col gap-5 lg:col-span-8">
              <RepoForm generator={generator} />
              <TokenField
                tokenState={tokenState}
                disabled={generator.status === "loading"}
              />
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <ContributionGrid status={generator.status} weeks={weeks} />
          <StatusText generator={generator} />
        </div>

        <div className="grid gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(300px,380px)] lg:gap-16">
          <ReadmeSheet generator={generator} />
          {/* Offset by the sheet's toolbar so the graph lines up with the sheet. */}
          <div aria-hidden="true" className="hidden lg:block">
            <div className="sticky top-10 pt-15">
              <GitGraph status={generator.status} />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
