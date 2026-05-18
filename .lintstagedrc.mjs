/**
 * lint-staged config — function form so we can merge CSS and font-file
 * matches into a single check-fonts invocation regardless of which
 * combination of file types is staged.
 *
 * Receiving all staged files lets us filter here, ensuring the command
 * runs at most once per commit even when both CSS and font files are staged.
 */

export default (stagedFiles) => {
  const commands = [];

  const tsFiles = stagedFiles.filter(
    (f) => f.endsWith(".ts") || f.endsWith(".tsx")
  );

  const prettierFiles = stagedFiles.filter(
    (f) =>
      f.endsWith(".ts") ||
      f.endsWith(".tsx") ||
      f.endsWith(".css") ||
      f.endsWith(".mjs") ||
      f.endsWith(".json")
  );

  if (prettierFiles.length > 0) {
    commands.push(`prettier --write ${prettierFiles.join(" ")}`);
  }

  if (tsFiles.length > 0) {
    commands.push(`eslint --max-warnings=0 ${tsFiles.join(" ")}`);
  }

  const fontRelated = stagedFiles.filter(
    (f) => f.endsWith(".css") || f.includes("/public/fonts/")
  );

  if (fontRelated.length > 0) {
    commands.push(
      `pnpm --filter @workspace/scripts run check-fonts -- ${fontRelated.join(" ")}`
    );
  }

  return commands;
};
