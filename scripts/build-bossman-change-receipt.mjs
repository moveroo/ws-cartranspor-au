import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const contract = "bossman.site-change-receipt.v1";
const receiptPath = ".well-known/bossman-change-receipt.json";
const planKeys = [
    "schemaVersion",
    "siteId",
    "canonicalUrl",
    "repoUrl",
    "experimentId",
    "changeKey",
    "resources",
];
const object = (value) =>
    value !== null && typeof value === "object" && !Array.isArray(value);
const within = (root, file) => {
    const relative = path.relative(root, file);
    return (
        relative !== ".." &&
        !relative.startsWith(`..${path.sep}`) &&
        !path.isAbsolute(relative)
    );
};

export function createReceipt({ plan, manifest, commit, distDir }) {
    if (
        !object(plan) ||
        Object.keys(plan).some((key) => !planKeys.includes(key)) ||
        planKeys.some((key) => !(key in plan)) ||
        plan.schemaVersion !== contract ||
        !Number.isSafeInteger(plan.siteId) ||
        plan.siteId < 1 ||
        !Number.isSafeInteger(plan.experimentId) ||
        plan.experimentId < 1 ||
        typeof plan.changeKey !== "string" ||
        !/^[a-z0-9_-]{1,160}$/.test(plan.changeKey) ||
        plan.canonicalUrl !== manifest?.site?.canonicalUrl ||
        plan.repoUrl !== manifest?.site?.repositoryUrl ||
        !/^https:\/\/[a-z0-9.-]+$/.test(plan.canonicalUrl) ||
        !/^https:\/\/github\.com\/[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/.test(
            plan.repoUrl,
        ) ||
        !/^[a-f0-9]{40}$/.test(commit) ||
        !Array.isArray(plan.resources) ||
        plan.resources.length < 1 ||
        plan.resources.length > 10
    ) {
        throw new Error(
            "Invalid public receipt plan, site identity or build commit.",
        );
    }
    const urls = new Set();
    // Validate every declaration before opening any resource.
    for (const resource of plan.resources) {
        if (
            !object(resource) ||
            Object.keys(resource).length !== 2 ||
            typeof resource.url !== "string" ||
            resource.url.length > 1000 ||
            ![
                "text/plain",
                "text/markdown",
                "text/html",
                "application/json",
            ].includes(resource.contentType)
        ) {
            throw new Error("Invalid public receipt resource.");
        }
        const url = new URL(resource.url);
        if (
            !resource.url.startsWith(`${plan.canonicalUrl}/`) ||
            url.origin !== plan.canonicalUrl ||
            url.search ||
            url.hash ||
            url.username ||
            url.password ||
            url.port ||
            resource.url.includes("?") ||
            resource.url.includes("#") ||
            resource.url.includes("\\") ||
            decodeURIComponent(resource.url).includes("..") ||
            urls.has(resource.url) ||
            url.pathname === `/${receiptPath}`
        ) {
            throw new Error(
                "Receipt resources must be unique exact same-origin public URLs.",
            );
        }
        urls.add(resource.url);
    }
    const realDist = fs.realpathSync(distDir);
    const resources = plan.resources.map((resource) => {
        const relative = new URL(resource.url).pathname.slice(1);
        const direct = path.join(realDist, relative);
        const candidate =
            fs.existsSync(direct) && fs.statSync(direct).isFile()
                ? direct
                : path.join(direct, "index.html");
        const file = fs.realpathSync(candidate);
        if (
            !within(realDist, file) ||
            !fs.statSync(file).isFile() ||
            fs.statSync(file).size > 524288
        ) {
            throw new Error(
                "Receipt resource is outside build output, not a file or exceeds 512 KiB.",
            );
        }
        return {
            ...resource,
            sha256: createHash("sha256")
                .update(fs.readFileSync(file))
                .digest("hex"),
        };
    });
    return { ...plan, resources, commit };
}

export function buildReceipt(rootDir, publishDirectory = "dist") {
    if (!["dist", ".vercel/output/static"].includes(publishDirectory)) {
        throw new Error(
            "Select the repository-owned dist or Vercel static publish directory.",
        );
    }
    const root = fs.realpathSync(rootDir);
    const planFile = path.join(root, "bossman-change-receipt-plan.json");
    // Clean both known caches, but never let their existence select publication.
    const candidates = [
        path.join(root, ".vercel/output/static"),
        path.join(root, "dist"),
    ];
    const outputs = [
        ...new Set(
            candidates
                .filter((dir) => fs.existsSync(dir))
                .map((dir) => fs.realpathSync(dir)),
        ),
    ];
    if (
        outputs.some(
            (dir) => !within(root, dir) || !fs.statSync(dir).isDirectory(),
        )
    ) {
        throw new Error("Build output must stay inside this repository.");
    }
    // Never re-publish a cached receipt when a plan was removed or verification fails.
    for (const output of outputs) {
        const parent = path.join(output, ".well-known");
        if (fs.existsSync(parent) && !within(output, fs.realpathSync(parent))) {
            throw new Error("Receipt output escapes the build directory.");
        }
        const prior = path.join(output, receiptPath);
        if (
            fs.existsSync(prior) ||
            fs.lstatSync(parent, { throwIfNoEntry: false })?.isSymbolicLink()
        ) {
            if (
                fs.lstatSync(prior, { throwIfNoEntry: false })?.isSymbolicLink()
            ) {
                throw new Error("Receipt output cannot be a symlink.");
            }
            fs.rmSync(prior, { force: true });
        }
    }
    if (!fs.existsSync(planFile)) {
        return { status: "not_planned", resources: 0 };
    }
    if (!fs.statSync(planFile).isFile() || fs.statSync(planFile).size > 65536) {
        throw new Error(
            "The public receipt plan must be a JSON file under 64 KiB.",
        );
    }
    const selected = path.join(root, publishDirectory);
    if (!fs.existsSync(selected))
        throw new Error(
            "Selected publish output is missing; run the website build first.",
        );
    const plan = JSON.parse(fs.readFileSync(planFile, "utf8"));
    const manifest = JSON.parse(
        fs.readFileSync(path.join(root, "bossman-site-manifest.json"), "utf8"),
    );
    const commit = execFileSync("git", ["rev-parse", "HEAD"], {
        cwd: root,
        encoding: "utf8",
    }).trim();
    for (const providerCommit of [
        process.env.VERCEL_GIT_COMMIT_SHA,
        process.env.COMMIT_REF,
    ]) {
        if (providerCommit && providerCommit !== commit)
            throw new Error(
                "Provider build commit differs from the checked-out commit.",
            );
    }
    const published = fs.realpathSync(selected);
    const receipt = createReceipt({
        plan,
        manifest,
        commit,
        distDir: published,
    });
    const destination = path.join(published, receiptPath);
    fs.mkdirSync(path.dirname(destination), { recursive: true });
    fs.writeFileSync(destination, `${JSON.stringify(receipt, null, 2)}\n`);
    return {
        status: "published",
        experimentId: receipt.experimentId,
        resources: receipt.resources.length,
        receipt,
    };
}

if (
    process.argv[1] &&
    path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
    const option = process.argv[2] ?? "--output=dist";
    if (process.argv.length > 3 || !option.startsWith("--output=")) {
        throw new Error(
            "Usage: build-bossman-change-receipt.mjs --output=dist|.vercel/output/static",
        );
    }
    const result = buildReceipt(
        fileURLToPath(new URL("../", import.meta.url)),
        option.slice("--output=".length),
    );
    console.log(
        result.status === "not_planned"
            ? "No active Bossman receipt plan; normal build preserved. No Bossman write access is needed."
            : `Published build receipt for experiment ${result.experimentId}, ${result.resources} resources.`,
    );
}
