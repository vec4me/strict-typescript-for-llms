import { execSync } from "node:child_process";
import { writeFileSync } from "node:fs";

const schemaUrl = "https://biomejs.dev/schemas/2.3.14/schema.json";

const off = new Set([
	"complexity/noExcessiveCognitiveComplexity",
	"complexity/noExcessiveLinesPerFunction",
	"complexity/noVoid",
	"correctness/noNodejsModules",
	"correctness/noProcessGlobal",
	"correctness/useImportExtensions",
	"correctness/useImageSize",
	"performance/noImgElement",
	"style/noDefaultExport",
	"style/noExportedImports",
	"style/noMagicNumbers",
	"style/noProcessEnv",
	"security/noSecrets",
	"style/useNamingConvention",
	"style/useConsistentObjectDefinitions",
	"style/useExportsLast",
	"suspicious/noConsole",
	"nursery/useDestructuring",
	"nursery/noContinue",
	"nursery/noExcessiveLinesPerFile",
	"nursery/noJsxLiterals",
	"nursery/noJsxPropsBind",
	"nursery/noTernary",
	"nursery/noUnknownAttribute",
	"nursery/noUnresolvedImports",
	"nursery/useAwaitThenable",
	"nursery/useExplicitType",
	"nursery/useMaxParams",
	"nursery/useSpread",
	"style/useObjectSpread",
]);

const response = await fetch(schemaUrl);
const schema = await response.json();

const ruleCategories = [
	"a11y",
	"complexity",
	"correctness",
	"nursery",
	"performance",
	"security",
	"style",
	"suspicious",
];

const frameworkPatterns = ["Vue", "Qwik", "React", "Next"];

function extractRules(schemaData) {
	const rules = {};
	for (const category of ruleCategories) {
		const categoryDef =
			schemaData.$defs[
				`${category.charAt(0).toUpperCase()}${category.slice(1)}`
			];
		if (categoryDef?.properties) {
			rules[category] = {};
			for (const rule of Object.keys(categoryDef.properties)) {
				if (rule === "recommended" || rule === "all") {
					continue;
				}
				const isFrameworkSpecific = frameworkPatterns.some((pattern) =>
					rule.includes(pattern),
				);
				const isOff = off.has(`${category}/${rule}`) || isFrameworkSpecific;
				rules[category][rule] = isOff ? "off" : "warn";
			}
		}
	}
	return rules;
}

const rules = extractRules(schema);

const config = {
	$schema: schemaUrl,
	plugins: ["./biome-rules.grit"],
	vcs: {
		enabled: true,
		clientKind: "git",
		useIgnoreFile: true,
	},
	files: {
		includes: ["**", "!!**/dist", "!!backend/_generated"],
	},
	formatter: {
		enabled: true,
		indentStyle: "tab",
	},
	linter: {
		enabled: true,
		domains: {
			solid: "all",
			test: "all",
		},
		rules: Object.assign({ recommended: false }, rules),
	},
	javascript: {
		formatter: {
			quoteStyle: "double",
		},
		linter: {
			enabled: true,
		},
	},
	json: {
		formatter: {
			enabled: true,
		},
		linter: {
			enabled: true,
		},
		assist: {
			enabled: true,
		},
	},
	css: {
		formatter: {
			enabled: true,
		},
		linter: {
			enabled: true,
		},
	},
	assist: {
		enabled: true,
		actions: {
			source: {
				organizeImports: "on",
			},
		},
	},
};

writeFileSync("biome.json", `${JSON.stringify(config, null, "\t")}\n`);
execSync("npx biome format --write biome.json", { stdio: "inherit" });
console.log("biome.json created from schema");
