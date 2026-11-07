export const BUILTIN_DAISY_THEMES = ["light", "dark", "corporate", "business", "cupcake"] as const;
export type BuiltinDaisyTheme = (typeof BUILTIN_DAISY_THEMES)[number];

export interface DaisyThemeConfig {
  defaultTheme: string;
  darkTheme?: string;
  enabledThemes: readonly string[];
}

export const DEFAULT_DAISY_THEME_CONFIG: DaisyThemeConfig = {
  defaultTheme: "light",
  darkTheme: "dark",
  enabledThemes: BUILTIN_DAISY_THEMES,
};

const THEME_NAME = /^[a-z][a-z0-9-]{0,49}$/;

export function validateThemeConfig(config: DaisyThemeConfig): string[] {
  const issues: string[] = [];
  if (!THEME_NAME.test(config.defaultTheme)) issues.push("Invalid default theme name");
  if (config.darkTheme && !THEME_NAME.test(config.darkTheme)) issues.push("Invalid dark theme name");
  if (!config.enabledThemes.includes(config.defaultTheme)) issues.push("Default theme must be enabled");
  if (config.darkTheme && !config.enabledThemes.includes(config.darkTheme)) issues.push("Dark theme must be enabled");
  if (new Set(config.enabledThemes).size !== config.enabledThemes.length) issues.push("Theme names must be unique");
  return issues;
}

export function themeAttributes(theme: string | undefined, config: DaisyThemeConfig = DEFAULT_DAISY_THEME_CONFIG): Record<string, string> {
  const selected = theme || config.defaultTheme;
  if (!config.enabledThemes.includes(selected)) throw new Error(`Theme is not enabled: ${selected}`);
  return { "data-theme": selected };
}

export function generateDaisyThemeCss(config: DaisyThemeConfig): string {
  const issues = validateThemeConfig(config);
  if (issues.length) throw new Error(issues.join("; "));
  const tokens = config.enabledThemes.map(name => name === config.defaultTheme ? `${name} --default` : name === config.darkTheme ? `${name} --prefersdark` : name);
  return `@plugin "daisyui" {\n  themes: ${tokens.join(", ")};\n}\n`;
}

export function generateBrandTheme(name: string, colors: { primary: string; secondary: string; accent: string; neutral?: string; base100?: string }): string {
  if (!THEME_NAME.test(name)) throw new Error("Invalid brand theme name");
  const color = (value: string) => {
    if (!/^#[0-9a-f]{6}$/i.test(value)) throw new Error(`Invalid theme color: ${value}`);
    return value;
  };
  return `@plugin "daisyui/theme" {\n  name: "${name}";\n  --color-primary: ${color(colors.primary)};\n  --color-secondary: ${color(colors.secondary)};\n  --color-accent: ${color(colors.accent)};\n  --color-neutral: ${color(colors.neutral ?? "#1f2937")};\n  --color-base-100: ${color(colors.base100 ?? "#ffffff")};\n}\n`;
}
