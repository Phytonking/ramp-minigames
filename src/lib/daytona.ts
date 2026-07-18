import { Daytona } from "@daytona/sdk";

let _daytona: Daytona | null = null;

function getDaytona() {
  if (!_daytona) {
    _daytona = new Daytona({
      apiKey: process.env.DAYTONA_API_KEY!,
      ...(process.env.DAYTONA_API_URL ? { apiUrl: process.env.DAYTONA_API_URL } : {}),
    });
  }
  return _daytona;
}

export type GamePreview = {
  workspaceId: string;
  previewUrl: string;
};

/** Builds all files for a minimal Vite+React sandbox that runs a single game component. */
function buildSandboxFiles(
  slug: string,
  gameCode: string,
  componentName: string,
  utilsCode: string,
  buttonCode: string,
  badgeCode: string,
  comingSoonCode: string
): Record<string, string> {
  const packageJson = JSON.stringify(
    {
      name: `game-${slug}`,
      private: true,
      type: "module",
      scripts: { dev: "vite --port 3000 --host 0.0.0.0" },
      dependencies: {
        react: "^19.0.0",
        "react-dom": "^19.0.0",
        motion: "^12.0.0",
        "lucide-react": "^0.400.0",
        "@radix-ui/react-slot": "^1.3.0",
        "class-variance-authority": "^0.7.1",
        clsx: "^2.1.1",
        "tailwind-merge": "^3.0.0",
      },
      devDependencies: {
        "@vitejs/plugin-react": "^4.0.0",
        "@tailwindcss/vite": "^4.0.0",
        tailwindcss: "^4.0.0",
        typescript: "^5.0.0",
        vite: "^6.0.0",
      },
    },
    null,
    2
  );

  const viteConfig = `import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: { alias: { "@": path.resolve(__dirname, "./src") } },
});
`;

  const indexHtml = `<!DOCTYPE html>
<html lang="en" class="dark">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${componentName}</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
`;

  const mainTsx = `import React from "react";
import ReactDOM from "react-dom/client";
import Game from "./components/games/${componentName}";
import "./index.css";

function handleComplete(result: { score: number; statValue: number }) {
  // Post score to parent window (GameViewer) for DB save
  window.parent.postMessage(
    { type: "game-complete", score: result.score, statValue: result.statValue },
    "*"
  );
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <Game onComplete={handleComplete} />
  </React.StrictMode>
);
`;

  // Full design token CSS so Tailwind classes resolve correctly.
  const indexCss = `@import "tailwindcss";

@custom-variant dark (&:where(.dark, .dark *));

:root {
  --canvas: #0b0b0c;
  --panel: #141416;
  --panel-2: #1a1a1d;
  --fg: #ededef;
  --fg-muted: #9a9a9f;
  --hairline: #2a2a2e;
  --focus: #2b3550;
  --grid-line: rgba(255, 255, 255, 0.035);
}

@theme inline {
  --color-solar: #e4f222;
  --color-solar-light: #f5ff78;
  --color-solar-strong: #e8e750;
  --color-blaze: #e96516;
  --color-on-solar: #0c0a08;
  --color-canvas: var(--canvas);
  --color-panel: var(--panel);
  --color-panel-2: var(--panel-2);
  --color-fg: var(--fg);
  --color-fg-muted: var(--fg-muted);
  --color-hairline: var(--hairline);
  --color-focus: var(--focus);
  --color-bg: var(--canvas);
  --color-surface: var(--panel);
  --color-ink: var(--fg);
  --color-ink-muted: var(--fg-muted);
  --color-line: var(--hairline);
  --color-night: var(--canvas);
  --color-night-soft: var(--panel);
  --color-night-card: var(--panel-2);
  --color-night-border: var(--hairline);
  --color-paper: var(--fg);
  --color-paper-muted: var(--fg-muted);
  --radius-xs: 4px;
  --radius-sm: 6px;
  --radius-md: 10px;
  --radius-lg: 14px;
}

* { border-color: var(--hairline); }

html { -webkit-font-smoothing: antialiased; }

body {
  background: var(--canvas);
  color: var(--fg);
  min-height: 100vh;
  font-family: ui-sans-serif, system-ui, sans-serif;
}
`;

  return {
    "package.json": packageJson,
    "vite.config.ts": viteConfig,
    "index.html": indexHtml,
    "src/main.tsx": mainTsx,
    "src/index.css": indexCss,
    "src/lib/utils.ts": utilsCode,
    "src/components/ui/button.tsx": buttonCode,
    "src/components/ui/badge.tsx": badgeCode,
    "src/components/games/ComingSoon.tsx": comingSoonCode,
    [`src/components/games/${componentName}.tsx`]: gameCode,
  };
}

/**
 * Spins up a minimal Vite+React Daytona sandbox containing only the game
 * component and its local deps. No Next.js — just react + motion + lucide.
 */
export async function createHardcodedGameSandbox(
  slug: string,
  gameCode: string,
  componentName: string,
  localDeps: {
    utils: string;
    button: string;
    badge: string;
    comingSoon: string;
  }
): Promise<GamePreview> {
  const daytona = getDaytona();

  const sandbox = await daytona.create({
    language: "typescript",
    envVars: { NODE_ENV: "development", GAME_SLUG: slug },
    autoStopInterval: 60,
    public: true,
  });

  const files = buildSandboxFiles(
    slug,
    gameCode,
    componentName,
    localDeps.utils,
    localDeps.button,
    localDeps.badge,
    localDeps.comingSoon
  );

  const homeDir = (await sandbox.getUserHomeDir()) ?? "/home/daytona";
  const projectDir = `${homeDir}/game`;

  // Upload all files (create dirs first)
  const dirs = new Set(
    Object.keys(files).map((p) => p.substring(0, p.lastIndexOf("/")))
  );
  for (const dir of dirs) {
    await sandbox.process.executeCommand(`mkdir -p ${projectDir}/${dir}`);
  }

  for (const [relPath, content] of Object.entries(files)) {
    // Strip "use client" directives — Vite doesn't need them
    const cleaned = content.replace(/^\s*["']use client["'];?\s*\n/m, "");
    await sandbox.fs.uploadFile(
      Buffer.from(cleaned),
      `${projectDir}/${relPath}`
    );
  }

  // Install deps
  await sandbox.process.executeCommand(`cd ${projectDir} && npm install`);

  // Start Vite dev server, then poll until it responds
  await sandbox.process.executeCommand(
    `cd ${projectDir} && npm run dev > /tmp/vite.log 2>&1 &`
  );
  await sandbox.process.executeCommand(
    "timeout 60 bash -c 'until curl -sf http://localhost:3000 > /dev/null; do sleep 2; done'"
  );

  const preview = await sandbox.getSignedPreviewUrl(3000, 86400);

  return { workspaceId: sandbox.id, previewUrl: preview.url };
}

/**
 * Spins up a Daytona sandbox for AI-generated games (full Next.js component).
 * @deprecated prefer createHardcodedGameSandbox for handcrafted games.
 */
export async function createGameSandbox(
  slug: string,
  componentCode: string
): Promise<GamePreview> {
  const daytona = getDaytona();

  const sandbox = await daytona.create({
    language: "typescript",
    envVars: { NODE_ENV: "development", GAME_SLUG: slug },
    autoStopInterval: 60,
  });

  await sandbox.process.executeCommand(
    `mkdir -p /app/src/app/game && cat > /app/src/app/game/page.tsx << 'COMPONENT_EOF'\n${componentCode}\nCOMPONENT_EOF`
  );

  await sandbox.process.executeCommand(
    "cd /app && npm install --prefer-offline && npm run dev &"
  );

  await sandbox.process.executeCommand("sleep 8");

  const preview = await sandbox.getPreviewLink(3000);

  return { workspaceId: sandbox.id, previewUrl: preview.url };
}

export async function deleteSandbox(workspaceId: string) {
  const daytona = getDaytona();
  const sandbox = await daytona.get(workspaceId);
  await daytona.delete(sandbox);
}
