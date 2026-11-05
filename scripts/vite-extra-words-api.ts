import { appendFileSync, existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import type { Plugin } from "vite";

const API_PATH = "/__gondolathid/extra-words";

function normalizeWord(raw: string): string | null {
  const word = raw.trim().toLocaleLowerCase("hu");
  if (word.length < 2 || word.length > 24) return null;
  if (!/^[a-záéíóöőúüűăâîșț0-9-]+$/u.test(word)) return null;
  return word;
}

/** Dev server: POST new lines to `public/data/extra-words.txt`. */
export function extraWordsDevApi(): Plugin {
  return {
    name: "gondolathid-extra-words-api",
    apply: "serve",
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        if (req.url !== API_PATH || req.method !== "POST") {
          next();
          return;
        }

        let body = "";
        req.on("data", (chunk) => {
          body += chunk;
        });
        req.on("end", () => {
          try {
            const parsed = JSON.parse(body) as { word?: string };
            const word = normalizeWord(parsed.word ?? "");
            if (!word) {
              res.statusCode = 400;
              res.setHeader("Content-Type", "application/json");
              res.end(JSON.stringify({ error: "Invalid word" }));
              return;
            }

            const file = join(process.cwd(), "public", "data", "extra-words.txt");
            if (existsSync(file)) {
              const existing = readFileSync(file, "utf8")
                .split(/\n/)
                .map((l) => l.trim().toLocaleLowerCase("hu"))
                .filter(Boolean);
              if (existing.includes(word)) {
                res.setHeader("Content-Type", "application/json");
                res.end(JSON.stringify({ ok: true, duplicate: true }));
                return;
              }
            }

            appendFileSync(file, `${word}\n`, "utf8");
            res.setHeader("Content-Type", "application/json");
            res.end(JSON.stringify({ ok: true }));
          } catch (err) {
            res.statusCode = 500;
            res.setHeader("Content-Type", "application/json");
            res.end(
              JSON.stringify({
                error: err instanceof Error ? err.message : "Unknown error",
              }),
            );
          }
        });
      });
    },
  };
}
