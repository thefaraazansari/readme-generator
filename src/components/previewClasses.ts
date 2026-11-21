export const PREVIEW_CLASSES = [
  "prose max-w-none px-6 py-10 font-readme text-[15px] text-body leading-7 sm:px-12 sm:py-14",
  // Headings
  "prose-headings:font-bold prose-headings:text-ink prose-headings:tracking-tight prose-h1:text-4xl prose-h2:text-xl",
  // Body text, lists and links
  "prose-p:text-body prose-li:text-body prose-li:marker:text-marker prose-a:text-link prose-strong:text-ink",
  // Keyboard focus on README links uses the theme ring too, not the browser default
  "prose-a:rounded-sm prose-a:focus-visible:outline-2 prose-a:focus-visible:outline-offset-2 prose-a:focus-visible:outline-link",
  // Inline code: GitHub-style chip, no stray backticks
  "prose-code:rounded prose-code:bg-code prose-code:px-1.5 prose-code:py-0.5 prose-code:font-normal prose-code:text-[0.85em] prose-code:text-ink",
  "prose-code:before:content-none prose-code:after:content-none [&_code]:font-[inherit]",
  // Code blocks
  "prose-pre:rounded-md prose-pre:bg-pre prose-pre:text-on-pre [&_pre]:font-[inherit] [&_pre_code]:bg-transparent [&_pre_code]:p-0 [&_pre_code]:text-on-pre",
  // Badges sit in one row, as on GitHub
  "prose-img:my-0 prose-img:mr-1 prose-img:inline",
  // Tables (Usage): theme borders, and scroll sideways instead of overflowing the sheet
  "prose-table:text-sm prose-th:text-ink prose-thead:border-line prose-tr:border-line",
  "[&_table]:block [&_table]:overflow-x-auto [&_td]:whitespace-nowrap",
].join(" ");
