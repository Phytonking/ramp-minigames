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

/**
 * Spins up a Daytona sandbox, injects a React game component, boots the
 * Next.js dev server, and returns the live preview URL.
 */
export async function createGameSandbox(
  slug: string,
  componentCode: string
): Promise<GamePreview> {
  const daytona = getDaytona();

  const sandbox = await daytona.create({
    language: "typescript",
    envVars: {
      NODE_ENV: "development",
      GAME_SLUG: slug,
    },
    autoStopInterval: 60, // auto-stop after 60 min idle
  });

  // Write component into a minimal Next.js shell
  await sandbox.process.executeCommand(
    `mkdir -p /app/src/app/game && cat > /app/src/app/game/page.tsx << 'COMPONENT_EOF'\n${componentCode}\nCOMPONENT_EOF`
  );

  // Boot dev server on port 3000 in background
  await sandbox.process.executeCommand(
    "cd /app && npm install --prefer-offline && npm run dev &"
  );

  // Wait for server to boot
  await sandbox.process.executeCommand("sleep 8");

  const preview = await sandbox.getPreviewLink(3000);

  return {
    workspaceId: sandbox.id,
    previewUrl: preview.url,
  };
}

export async function deleteSandbox(workspaceId: string) {
  const daytona = getDaytona();
  await daytona.delete(workspaceId);
}
