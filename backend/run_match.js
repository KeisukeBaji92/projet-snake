// backend/run_match.js
import { spawn } from "child_process";
import { initGame, tick } from "./engine.js";

/* ────────────── CONFIG ────────────── */
const BOT_TIMEOUT_MS = 50;       // 50 ms max par coup
const MAX_TURNS      = 500;      // sécurité anti-boucles
const PYTHON_BIN =
  process.platform === "win32" ? "python" : "python3"; // Win : python.exe

/* ────────────── UTIL ────────────── */
function dirFrom(str) {
  switch (str) {
    case "UP":    return { x: -1, y:  0 };
    case "DOWN":  return { x:  1, y:  0 };
    case "LEFT":  return { x:  0, y: -1 };
    case "RIGHT": return { x:  0, y:  1 };
    default:      return { x:  0, y:  0 }; // immobile → collision au tour suivant
  }
}

/* Lance un bot Python et renvoie sa réponse ("UP" …) */
function runBot(pyFile, gameState) {
  return new Promise((resolve, reject) => {
    const child = spawn(PYTHON_BIN, [pyFile], {
      stdio: ["pipe", "pipe", "inherit"],
    });

    /*  Timeout : on kill si le bot traîne  */
    const timer = setTimeout(() => {
      child.kill("SIGKILL");
      reject(new Error("timeout"));
    }, BOT_TIMEOUT_MS);

    /*  Lecture de la réponse  */
    child.stdout.once("data", chunk => {
      clearTimeout(timer);
      resolve(chunk.toString().trim());            // ex : "UP"
    });

    /*  Gestion d’erreur de spawn  */
    child.on("error", err => {
      clearTimeout(timer);
      reject(new Error(`spawn-error: ${err.message}`));
    });

    /*  On envoie le state JSON sur stdin  */
    child.stdin.write(JSON.stringify(gameState));
    child.stdin.end();
  });
}

/* ────────────── MOTEUR DE MATCH ────────────── */
export async function match(bot1Path, bot2Path) {
  let game = initGame();

  for (let turn = 1; turn <= MAX_TURNS; turn++) {
    const baseState = {
      rows: game.rows,
      cols: game.cols,
      food: game.food,
    };

    /*  Chaque bot se voit comme « my » (symétrie)  */
    const state1 = { ...baseState, my: game.s1, enemy: game.s2 };
    const state2 = { ...baseState, my: game.s2, enemy: game.s1 };

    /*  On interroge les deux bots en parallèle  */
    let m1, m2;
    try {
      [m1, m2] = await Promise.all([runBot(bot1Path, state1), runBot(bot2Path, state2)]);
    } catch (err) {
      console.error(`⚠️  Bot error au tour ${turn}:`, err.message);
      /*  Bot fautif = perdant immédiat  */
      if (err.message.startsWith("spawn-error")) {
        return { winner: 0, turns: turn, reason: "spawn-error" };
      }
      return { winner: err.bot === 1 ? 2 : 1, turns: turn, reason: err.message };
    }

    console.log(`[TURN ${turn}] bot1→${m1} | bot2→${m2}`);

    const { state, loser, draw } = tick(game, dirFrom(m1), dirFrom(m2));
    game = state;

    if (draw)  return { winner: 0, turns: turn, reason: "draw" };
    if (loser) return { winner: loser === 1 ? 2 : 1, turns: turn, reason: "collision" };
  }
  return { winner: 0, turns: MAX_TURNS, reason: "max-turns" };
}

/* ────────────── CLI de test ──────────────
   node backend/run_match.js bots/random_bot.py bots/straight_bot.py
—————————————————————————————— */
if (process.argv.length === 4) {
  const [ , , bot1, bot2 ] = process.argv;
  match(bot1, bot2).then(res => {
    console.log("\nRésultat :", res);
    process.exit(0);
  });
}
