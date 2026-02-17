import { $ } from "bun";
import { mkdirSync, readFileSync, writeFileSync } from "fs";

export interface BuildOptions {
  entry: string;
  output: string;
  tempOutput: string;
  dist: string;
  externalModules?: string[];
}

export interface SharedModule {
  name: string;
  globalPath: string;
}

const external_modules = [
  "react",
  "react-dom",
  "react/jsx-runtime",
  "react/jsx-dev-runtime",
  "sonner",
  "dexie-react-hooks",
  "framer-motion",
  "@use-stall/icons",
  "@use-stall/ui",
  "@use-stall/types",
  "@use-stall/core",
  "react-router-dom",
  "zustand",
  "zustand/middleware",
];

const default_shared_modules: SharedModule[] = external_modules.map(
  (module_name) => ({
    name: module_name,
    globalPath: `window.__STALL_SHARED_MODULES__["${module_name}"]`,
  }),
);

const fix_as_syntax = (named: string): string =>
  named.replace(/\s+as\s+/g, ":");

interface ReplacementRule {
  pattern: RegExp;
  replacement: string | ((...args: string[]) => string);
}

const generate_replacements = (module: SharedModule): ReplacementRule[] => {
  const module_name = module.name;
  const global_path = module.globalPath;
  const module_path = `"${module_name}"`;
  const module_path_no_space = `from"${module_name}"`;

  return [
    {
      pattern: new RegExp(`import\\*as ([\\w$]+) from${module_path}`, "g"),
      replacement: `const $1=${global_path}`,
    },
    {
      pattern: new RegExp(`import\\*as ([\\w$]+)${module_path_no_space}`, "g"),
      replacement: `const $1=${global_path}`,
    },
    {
      pattern: new RegExp(
        `import ([\\w$]+),\\{([^}]+)\\} from${module_path}`,
        "g",
      ),
      replacement: (_match: string, def: string, named: string): string =>
        `const ${def}=${global_path};const{${fix_as_syntax(named)}}=${global_path}`,
    },
    {
      pattern: new RegExp(
        `import ([\\w$]+),\\{([^}]+)\\}${module_path_no_space}`,
        "g",
      ),
      replacement: (_match: string, def: string, named: string): string =>
        `const ${def}=${global_path};const{${fix_as_syntax(named)}}=${global_path}`,
    },
    {
      pattern: new RegExp(`import ([\\w$]+) from${module_path}`, "g"),
      replacement: `const $1=${global_path}`,
    },
    {
      pattern: new RegExp(`import ([\\w$]+)${module_path_no_space}`, "g"),
      replacement: `const $1=${global_path}`,
    },
    {
      pattern: new RegExp(`import\\{([^}]+)\\} from${module_path}`, "g"),
      replacement: (_match: string, named: string): string =>
        `const{${fix_as_syntax(named)}}=${global_path}`,
    },
    {
      pattern: new RegExp(`import\\{([^}]+)\\}${module_path_no_space}`, "g"),
      replacement: (_match: string, named: string): string =>
        `const{${fix_as_syntax(named)}}=${global_path}`,
    },
  ];
};

const post_process_code = (
  code: string,
  shared_modules: SharedModule[] = default_shared_modules,
): string => {
  let processed_code = code;

  for (const shared_module of shared_modules) {
    const replacements = generate_replacements(shared_module);
    for (const rule of replacements) {
      processed_code = processed_code.replace(
        rule.pattern,
        rule.replacement as never,
      );
    }
  }

  return processed_code;
};

export const rebuild = async (
  options: BuildOptions,
  shared_modules: SharedModule[] = default_shared_modules,
): Promise<void> => {
  try {
    const { entry, output, tempOutput, dist, externalModules = [] } = options;

    mkdirSync(dist, { recursive: true });

    const external_args = externalModules.flatMap((mod) => ["--external", mod]);

    await $`bun build --minify --format=esm ${external_args} ${entry} --outfile ${tempOutput}`.quiet();

    let code = readFileSync(tempOutput, "utf-8");
    code = post_process_code(code, shared_modules);

    const wrapped_code = `if(!window.__STALL_SHARED_MODULES__)throw new Error("Shared modules not available");${code}`;
    writeFileSync(output, wrapped_code);

    console.log(`[✓] Built at ${new Date().toLocaleTimeString()}`);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Build failed";
    console.error(`[x] Build error: ${message}`);
  }
};

export const getDefaultBuildOptions = (
  overrides?: Partial<BuildOptions>,
): BuildOptions => {
  return {
    entry: "./src/index.ts",
    dist: "dist",
    output: "dist/index.js",
    tempOutput: "dist/temp.js",
    externalModules: external_modules,
    ...overrides,
  };
};
