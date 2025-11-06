import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

// Read package.json to get the version
const packageJson = JSON.parse(
	readFileSync(join(process.cwd(), "package.json"), "utf-8"),
);

const version = packageJson.version;

// Generate version.ts file
const versionFileContent = `// This file is auto-generated during build. Do not edit manually.
export const VERSION = "${version}";
`;

// Write to src/version.ts
writeFileSync(
	join(process.cwd(), "src", "version.ts"),
	versionFileContent,
	"utf-8",
);

console.log(`✓ Generated src/version.ts with version: ${version}`);
