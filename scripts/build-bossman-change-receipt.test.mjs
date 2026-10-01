import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import {
    buildReceipt,
    createReceipt,
} from "./build-bossman-change-receipt.mjs";

const manifest = {
    site: {
        canonicalUrl: "https://example.test",
        repositoryUrl: "https://github.com/example/site",
    },
};
const plan = {
    schemaVersion: "bossman.site-change-receipt.v1",
    siteId: 99,
    canonicalUrl: manifest.site.canonicalUrl,
    repoUrl: manifest.site.repositoryUrl,
    experimentId: 987,
    changeKey: "approved-change",
    resources: [
        { url: "https://example.test/llms.txt", contentType: "text/plain" },
        { url: "https://example.test/guide/", contentType: "text/html" },
    ],
};
const sha = (bytes) => createHash("sha256").update(bytes).digest("hex");
const commit = "a".repeat(40);
function fixture(fn) {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), "bossman-receipt-"));
    const environment = [
        process.env.VERCEL_GIT_COMMIT_SHA,
        process.env.COMMIT_REF,
    ];
    delete process.env.VERCEL_GIT_COMMIT_SHA;
    delete process.env.COMMIT_REF;
    try {
        fn(root);
    } finally {
        for (const [index, key] of [
            "VERCEL_GIT_COMMIT_SHA",
            "COMMIT_REF",
        ].entries()) {
            if (environment[index] === undefined) delete process.env[key];
            else process.env[key] = environment[index];
        }
        fs.rmSync(root, { recursive: true, force: true });
    }
}
function output(root, relative = "dist") {
    const dir = path.join(root, relative);
    fs.mkdirSync(path.join(dir, "guide"), { recursive: true });
    fs.writeFileSync(path.join(dir, "llms.txt"), "final agent guidance");
    fs.writeFileSync(
        path.join(dir, "guide/index.html"),
        "<h1>Final guide</h1>",
    );
    return dir;
}
function setup(root, active = plan) {
    fs.writeFileSync(
        path.join(root, "bossman-site-manifest.json"),
        JSON.stringify(manifest),
    );
    fs.writeFileSync(
        path.join(root, "bossman-change-receipt-plan.json"),
        JSON.stringify(active),
    );
    execFileSync("git", ["init", "-q"], { cwd: root });
    execFileSync(
        "git",
        [
            "-c",
            "user.name=Receipt Test",
            "-c",
            "user.email=test@example.test",
            "-c",
            "commit.gpgsign=false",
            "commit",
            "--allow-empty",
            "-qm",
            "fixture",
        ],
        { cwd: root },
    );
    return execFileSync("git", ["rev-parse", "HEAD"], {
        cwd: root,
        encoding: "utf8",
    }).trim();
}

test("hashes final files and nested HTML without publishing secrets", () =>
    fixture((root) => {
        const dir = output(root);
        const receipt = createReceipt({ plan, manifest, commit, distDir: dir });
        assert.equal(receipt.experimentId, 987);
        assert.equal(receipt.resources[0].sha256, sha("final agent guidance"));
        assert.equal(receipt.resources[1].sha256, sha("<h1>Final guide</h1>"));
        assert.deepEqual(Object.keys(receipt), [
            ...Object.keys(plan),
            "commit",
        ]);
        fs.writeFileSync(path.join(dir, "llms.txt"), "changed final bytes");
        assert.equal(
            createReceipt({ plan, manifest, commit, distDir: dir }).resources[0]
                .sha256,
            sha("changed final bytes"),
        );
    }));

for (const [name, changed] of Object.entries({
    secret: { ...plan, token: "not-a-real-secret" },
    invalidSite: { ...plan, siteId: 0 },
    invalidExperiment: { ...plan, experimentId: 0 },
    wrongHost: { ...plan, canonicalUrl: "https://other.test" },
    wrongRepository: { ...plan, repoUrl: "https://github.com/example/other" },
    crossHost: {
        ...plan,
        resources: [
            { url: "https://other.test/guide/", contentType: "text/html" },
        ],
    },
    query: {
        ...plan,
        resources: [
            {
                url: "https://example.test/guide/?private=true",
                contentType: "text/html",
            },
        ],
    },
    fragment: {
        ...plan,
        resources: [
            {
                url: "https://example.test/guide/#part",
                contentType: "text/html",
            },
        ],
    },
    traversal: {
        ...plan,
        resources: [
            {
                url: "https://example.test/%2e%2e/private.txt",
                contentType: "text/plain",
            },
        ],
    },
    duplicate: { ...plan, resources: [plan.resources[0], plan.resources[0]] },
    selfReceipt: {
        ...plan,
        resources: [
            {
                url: "https://example.test/.well-known/bossman-change-receipt.json",
                contentType: "application/json",
            },
        ],
    },
    tooMany: {
        ...plan,
        resources: Array.from({ length: 11 }, (_, i) => ({
            url: `https://example.test/${i}`,
            contentType: "text/html",
        })),
    },
    extraResourceField: {
        ...plan,
        resources: [{ ...plan.resources[0], secret: "not-real" }],
    },
})) {
    test(`rejects ${name} before opening resources`, () => {
        assert.throws(() =>
            createReceipt({
                plan: changed,
                manifest,
                commit,
                distDir: "/missing-receipt-fixture",
            }),
        );
    });
}

test("missing resources and invalid commits cannot produce proof", () =>
    fixture((root) => {
        const dir = output(root);
        fs.rmSync(path.join(dir, "llms.txt"));
        assert.throws(() =>
            createReceipt({ plan, manifest, commit, distDir: dir }),
        );
        assert.throws(() =>
            createReceipt({ plan, manifest, commit: "unknown", distDir: dir }),
        );
    }));

test("oversized and escaping resource files fail closed", () =>
    fixture((root) => {
        const dir = output(root);
        fs.writeFileSync(path.join(dir, "llms.txt"), Buffer.alloc(524289));
        assert.throws(() =>
            createReceipt({ plan, manifest, commit, distDir: dir }),
        );
        fs.rmSync(path.join(dir, "llms.txt"));
        fs.writeFileSync(path.join(root, "private.txt"), "must not publish");
        fs.symlinkSync(
            path.join(root, "private.txt"),
            path.join(dir, "llms.txt"),
        );
        assert.throws(() =>
            createReceipt({ plan, manifest, commit, distDir: dir }),
        );
    }));

test("no plan preserves a normal build and removes only its stale receipt", () =>
    fixture((root) => {
        assert.equal(buildReceipt(root).status, "not_planned");
        for (const variant of ["dist", ".vercel/output/static"]) {
            const dir = output(root, variant);
            fs.mkdirSync(path.join(dir, ".well-known"));
            fs.writeFileSync(
                path.join(dir, ".well-known/bossman-change-receipt.json"),
                "old receipt",
            );
            fs.writeFileSync(path.join(dir, ".well-known/other.json"), "keep");
        }
        assert.equal(buildReceipt(root).status, "not_planned");
        for (const variant of ["dist", ".vercel/output/static"]) {
            assert.equal(
                fs.existsSync(
                    path.join(
                        root,
                        variant,
                        ".well-known/bossman-change-receipt.json",
                    ),
                ),
                false,
            );
            assert.equal(
                fs.readFileSync(
                    path.join(root, variant, ".well-known/other.json"),
                    "utf8",
                ),
                "keep",
            );
        }
    }));

for (const variant of ["dist", ".vercel/output/static"]) {
    test(`publishes real checkout proof into ${variant}`, () =>
        fixture((root) => {
            const expectedCommit = setup(root);
            const dir = output(root, variant);
            const result = buildReceipt(root, variant);
            assert.equal(result.status, "published");
            const receipt = JSON.parse(
                fs.readFileSync(
                    path.join(dir, ".well-known/bossman-change-receipt.json"),
                ),
            );
            assert.equal(receipt.commit, expectedCommit);
            assert.equal(
                receipt.resources[0].sha256,
                sha("final agent guidance"),
            );
        }));
}

test("explicit Vercel publication hashes adapter bytes, not scratch dist", () =>
    fixture((root) => {
        setup(root);
        output(root);
        const published = output(root, ".vercel/output/static");
        fs.writeFileSync(
            path.join(published, "llms.txt"),
            "adapter final bytes",
        );
        assert.equal(
            buildReceipt(root, ".vercel/output/static").receipt.resources[0]
                .sha256,
            sha("adapter final bytes"),
        );
        assert.equal(
            fs.existsSync(
                path.join(root, "dist/.well-known/bossman-change-receipt.json"),
            ),
            false,
        );
    }));

test("current Netlify/static dist is used even with stale Vercel output", () =>
    fixture((root) => {
        setup(root);
        const published = output(root);
        output(root, ".vercel/output/static");
        fs.writeFileSync(
            path.join(published, "llms.txt"),
            "current dist bytes",
        );
        assert.equal(
            buildReceipt(root, "dist").receipt.resources[0].sha256,
            sha("current dist bytes"),
        );
        assert.equal(
            fs.existsSync(
                path.join(
                    root,
                    ".vercel/output/static/.well-known/bossman-change-receipt.json",
                ),
            ),
            false,
        );
    }));

test("selected missing or unknown output never falls back to a different tree", () =>
    fixture((root) => {
        setup(root);
        output(root);
        assert.throws(() => buildReceipt(root, ".vercel/output/static"));
        assert.throws(() => buildReceipt(root, "../private"));
    }));

for (const key of ["VERCEL_GIT_COMMIT_SHA", "COMMIT_REF"]) {
    test(`fails ${key} mismatch and removes stale proof`, () =>
        fixture((root) => {
            setup(root);
            const dir = output(root);
            buildReceipt(root);
            process.env[key] = "b".repeat(40);
            assert.throws(() => buildReceipt(root));
            assert.equal(
                fs.existsSync(
                    path.join(dir, ".well-known/bossman-change-receipt.json"),
                ),
                false,
            );
        }));
}

test("invalid active plan and oversized plan fail; absence is not invalidity", () =>
    fixture((root) => {
        output(root);
        setup(root, { ...plan, token: "not-real" });
        assert.throws(() => buildReceipt(root));
        fs.writeFileSync(
            path.join(root, "bossman-change-receipt-plan.json"),
            " ".repeat(65537),
        );
        assert.throws(() => buildReceipt(root));
    }));

test("symlinked output or receipt destination never writes outside build", () =>
    fixture((root) => {
        setup(root);
        const dir = output(root);
        const privateDir = path.join(root, "private");
        fs.mkdirSync(privateDir);
        fs.writeFileSync(
            path.join(privateDir, "bossman-change-receipt.json"),
            "retain",
        );
        fs.symlinkSync(privateDir, path.join(dir, ".well-known"));
        assert.throws(() => buildReceipt(root));
        assert.equal(
            fs.readFileSync(
                path.join(privateDir, "bossman-change-receipt.json"),
                "utf8",
            ),
            "retain",
        );
    }));
