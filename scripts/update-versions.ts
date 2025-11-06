import { writeFileSync } from "node:fs";
import { join } from "node:path";

interface VersionsJSON {
	latest: string;
	channels: Record<string, string>;
}

// Read package.json to get the new version
const packageJson = await import(
	`file://${join(process.cwd(), "package.json")}`,
	{ with: { type: "json" } }
);
const newVersion = packageJson.default.version;

// Parse semver
const [major, minor] = newVersion.split(".").map(Number);

// Fetch existing versions.json from main branch (central truth)
const baseUrl =
	process.env.BASE_URL ||
	"https://raw.githubusercontent.com/Ava-Technologies-Org/whisper-llm-cards/main";
const versionsUrl = `${baseUrl}/versions.json`;

let versions: VersionsJSON;

try {
	const response = await fetch(versionsUrl);
	if (response.ok) {
		versions = await response.json();
		console.log(`✓ Fetched existing versions.json from main branch`);
	} else {
		console.log(
			`ℹ No existing versions.json found on main (${response.status}), creating new one`,
		);
		versions = {
			latest: newVersion,
			channels: {},
		};
	}
} catch (error) {
	console.log(
		`ℹ Could not fetch versions.json from main (${error}), creating new one`,
	);
	versions = {
		latest: newVersion,
		channels: {},
	};
}

// Helper to compare semver versions
function isNewerVersion(v1: string, v2: string): boolean {
	const [maj1, min1, pat1] = v1.split(".").map(Number);
	const [maj2, min2, pat2] = v2.split(".").map(Number);

	if (maj1 !== maj2) return maj1 > maj2;
	if (min1 !== min2) return min1 > min2;
	return pat1 > pat2;
}

// Update latest if this is newer
if (
	!versions.latest ||
	isNewerVersion(newVersion, versions.latest)
) {
	versions.latest = newVersion;
}

// Update channel pointers
const majorChannel = `${major}`;
const minorChannel = `${major}.${minor}`;

// Update major channel if newer
if (
	!versions.channels[majorChannel] ||
	isNewerVersion(newVersion, versions.channels[majorChannel])
) {
	versions.channels[majorChannel] = newVersion;
}

// Update minor channel if newer
if (
	!versions.channels[minorChannel] ||
	isNewerVersion(newVersion, versions.channels[minorChannel])
) {
	versions.channels[minorChannel] = newVersion;
}

// Write updated versions.json to local file
const versionsPath = join(process.cwd(), "versions.json");
writeFileSync(versionsPath, `${JSON.stringify(versions, null, 2)}\n`, "utf-8");

console.log(`✓ Updated versions.json with version: ${newVersion}`);
console.log(`  - latest: ${versions.latest}`);
console.log(`  - channel ${majorChannel}: ${versions.channels[majorChannel]}`);
console.log(`  - channel ${minorChannel}: ${versions.channels[minorChannel]}`);
