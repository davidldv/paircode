import { spawn } from "node:child_process";
import net from "node:net";
import process from "node:process";

const mode = process.argv[2] === "start" ? "start" : "dev";
const rootDirectory = new URL("../", import.meta.url);
const runtime = process.execPath;
const nextPort = Number(process.env.PORT ?? 3000);
const wsPort = Number(process.env.WS_PORT ?? 3001);

function log(message) {
  console.log(`[runner:${mode}] ${message}`);
}

function portInUse(port) {
  return new Promise((resolve, reject) => {
    const socket = net.createConnection({ host: "127.0.0.1", port });

    socket.once("connect", () => {
      socket.destroy();
      resolve(true);
    });

    socket.once("error", (error) => {
      if (error && typeof error === "object" && "code" in error && error.code === "ECONNREFUSED") {
        resolve(false);
        return;
      }

      reject(error);
    });

    socket.setTimeout(600, () => {
      socket.destroy();
      resolve(false);
    });
  });
}

function createServiceArgs(kind) {
  if (mode === "start") {
    return kind === "web" ? ["run", "start:web"] : ["run", "start:ws"];
  }

  return kind === "web" ? ["run", "dev:web"] : ["run", "dev:ws"];
}

function createServiceLabel(kind) {
  if (kind === "web") {
    return mode === "start" ? `Next.js on ${nextPort}` : `Next.js dev on ${nextPort}`;
  }

  return `WebSocket server on ${wsPort}`;
}

const children = new Map();
let shuttingDown = false;

function stopAll(exitCode = 0) {
  if (shuttingDown) {
    return;
  }

  shuttingDown = true;

  for (const child of children.values()) {
    if (!child.killed) {
      child.kill();
    }
  }

  setTimeout(() => {
    process.exit(exitCode);
  }, 150).unref();
}

function launchService(kind) {
  const label = createServiceLabel(kind);
  const child = spawn(runtime, createServiceArgs(kind), {
    cwd: rootDirectory,
    env: process.env,
    stdio: "inherit",
  });

  children.set(kind, child);
  log(`Starting ${label}.`);

  child.once("exit", (code, signal) => {
    children.delete(kind);

    if (shuttingDown) {
      if (children.size === 0) {
        process.exit(code ?? 0);
      }
      return;
    }

    if (signal) {
      log(`${label} stopped by signal ${signal}.`);
      stopAll(0);
      return;
    }

    if ((code ?? 0) !== 0) {
      log(`${label} exited with code ${code}.`);
      stopAll(code ?? 1);
      return;
    }

    if (children.size === 0) {
      process.exit(0);
    }
  });
}

async function main() {
  const nextBusy = await portInUse(nextPort);
  const wsBusy = await portInUse(wsPort);

  if (mode === "start") {
    if (nextBusy) {
      throw new Error(`Port ${nextPort} is already in use. Stop the existing process before running bun run start.`);
    }

    if (wsBusy) {
      throw new Error(`Port ${wsPort} is already in use. Stop the existing process before running bun run start.`);
    }

    launchService("ws");
    launchService("web");
    return;
  }

  if (nextBusy) {
    log(`Port ${nextPort} is already in use. Reusing the existing Next.js process.`);
  } else {
    launchService("web");
  }

  if (wsBusy) {
    log(`Port ${wsPort} is already in use. Reusing the existing websocket process.`);
  } else {
    launchService("ws");
  }

  if (children.size === 0) {
    log(`Ports ${nextPort} and ${wsPort} are both in use. Leaving the existing dev services untouched.`);
    process.exit(0);
  }
}

process.on("SIGINT", () => stopAll(0));
process.on("SIGTERM", () => stopAll(0));

main().catch((error) => {
  console.error(`[runner:${mode}] ${error instanceof Error ? error.message : String(error)}`);
  process.exit(1);
});