const express = require("express");
const http = require("http");
const path = require("path");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server);
app.use(express.static(path.join(__dirname, "public")));

const PORT = process.env.PORT || 3000;
const rooms = new Map();

const questions = {
  "Sport": [
    { value: 100, q: "Wie viele Spieler stehen bei einer Fußballmannschaft regulär gleichzeitig auf dem Platz?", a: "11" },
    { value: 200, q: "Wie lang ist ein Marathon ungefähr?", a: "42,195 Kilometer" },
    { value: 300, q: "In welcher Sportart gibt es einen Begriff namens 'Ippon'?", a: "Judo" },
    { value: 400, q: "Welches Land gewann die Rugby-Weltmeisterschaft der Männer 2023?", a: "Südafrika" },
    { value: 500, q: "Wer hält den Männer-Weltrekord über 100 Meter (Stand 2026)?", a: "Usain Bolt (9,58 Sekunden)" }
  ],
  "Flaggen": [
    { value: 100, q: "Welche Farben hat die Flagge Deutschlands von oben nach unten?", a: "Schwarz, Rot, Gold" },
    { value: 200, q: "Welches Land hat ein rotes Ahornblatt auf seiner Flagge?", a: "Kanada" },
    { value: 300, q: "Welches Land hat eine Flagge mit einem weißen Kreuz auf rotem Grund?", a: "Schweiz" },
    { value: 400, q: "Welches Land hat als einziges eine nicht rechteckige Nationalflagge?", a: "Nepal" },
    { value: 500, q: "Welches Land zeigt auf seiner Flagge einen AK-47?", a: "Mosambik" }
  ],
  "Allgemeinwissen": [
    { value: 100, q: "Wie viele Minuten hat eine Stunde?", a: "60" },
    { value: 200, q: "Welcher Planet ist der Sonne am nächsten?", a: "Merkur" },
    { value: 300, q: "Wie heißt die Hauptstadt von Australien?", a: "Canberra" },
    { value: 400, q: "Welches chemische Symbol hat Silber?", a: "Ag" },
    { value: 500, q: "Wie heißt die Grenze, an der sich Erdkruste und Erdmantel befinden?", a: "Mohorovičić-Diskontinuität (Moho)" }
  ],
  "Gaming": [
    { value: 100, q: "Wie heißt der grüne Dinosaurier aus vielen Mario-Spielen?", a: "Yoshi" },
    { value: 200, q: "Welche Firma entwickelt Minecraft?", a: "Mojang Studios" },
    { value: 300, q: "Wie heißt die Währung in Fortnite, mit der man viele Skins kauft?", a: "V-Bucks" },
    { value: 400, q: "In welchem Jahr erschien die erste PlayStation in Japan?", a: "1994" },
    { value: 500, q: "Wie heißt die fiktive Region der ersten Pokémon-Spiele?", a: "Kanto" }
  ],
  "Zurück in die Schule": [
    { value: 100, q: "Wie viel ist 7 × 8?", a: "56" },
    { value: 200, q: "Wie nennt man ein Wort, das ein Hauptwort näher beschreibt?", a: "Adjektiv" },
    { value: 300, q: "Wie viele Seiten hat ein Hexagon?", a: "6" },
    { value: 400, q: "Was ist die chemische Formel von Wasser?", a: "H₂O" },
    { value: 500, q: "Wie nennt man den Vorgang, bei dem Pflanzen Licht in chemische Energie umwandeln?", a: "Fotosynthese" }
  ],
  "Marken": [
    { value: 100, q: "Welche Marke hat einen angebissenen Apfel als Logo?", a: "Apple" },
    { value: 200, q: "Welche Sportmarke ist für die drei Streifen bekannt?", a: "Adidas" },
    { value: 300, q: "Welche Automarke verwendet vier ineinanderliegende Ringe?", a: "Audi" },
    { value: 400, q: "Welche schwedische Möbelmarke ist für ihre flachen Selbstbaumöbel bekannt?", a: "IKEA" },
    { value: 500, q: "Welche Firma entwickelte die Spielkonsole Nintendo Switch?", a: "Nintendo" }
  ]
};

function publicState(room) {
  return {
    code: room.code,
    players: [...room.players.values()].map(p => ({ id: p.id, name: p.name, score: p.score, host: p.host })),
    used: [...room.used],
    current: room.current,
    buzzWinner: room.buzzWinner,
    buzzOpen: room.buzzOpen,
    buzzEndsAt: room.buzzEndsAt,
    reveal: room.reveal,
    status: room.status
  };
}
function emitRoom(room) { io.to(room.code).emit("state", publicState(room)); }
function makeCode() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 5; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}
function findRoom(socket) {
  for (const room of rooms.values()) if (room.players.has(socket.id)) return room;
  return null;
}

io.on("connection", socket => {
  socket.on("createRoom", ({ name }, cb) => {
    const code = makeCode();
    const room = { code, players: new Map(), used: new Set(), current: null, buzzWinner: null,
      buzzOpen: false, buzzEndsAt: null, reveal: false, status: "lobby", hostId: socket.id };
    room.players.set(socket.id, { id: socket.id, name: String(name || "Host").slice(0, 24), score: 0, host: true });
    rooms.set(code, room);
    socket.join(code);
    cb?.({ ok: true, code, state: publicState(room) });
    emitRoom(room);
  });

  socket.on("joinRoom", ({ code, name }, cb) => {
    const room = rooms.get(String(code || "").toUpperCase().trim());
    if (!room) return cb?.({ ok: false, error: "Spielcode nicht gefunden." });
    room.players.set(socket.id, { id: socket.id, name: String(name || "Spieler").slice(0, 24), score: 0, host: false });
    socket.join(room.code);
    cb?.({ ok: true, code: room.code, state: publicState(room) });
    emitRoom(room);
  });

  socket.on("startGame", (_, cb) => {
    const room = findRoom(socket);
    if (!room || room.hostId !== socket.id) return cb?.({ ok: false, error: "Nur der Host kann starten." });
    if (room.players.size < 2) return cb?.({ ok: false, error: "Mindestens zwei Spieler werden benötigt." });
    room.status = "game"; emitRoom(room); cb?.({ ok: true });
  });

  socket.on("chooseQuestion", ({ category, value }, cb) => {
    const room = findRoom(socket);
    if (!room || room.hostId !== socket.id) return cb?.({ ok: false, error: "Nur der Host kann Fragen auswählen." });
    const key = `${category}|${value}`;
    const q = (questions[category] || []).find(x => x.value === Number(value));
    if (!q || room.used.has(key) || room.current) return cb?.({ ok: false, error: "Diese Frage ist nicht verfügbar." });
    room.current = { category, value: Number(value), question: q.q, answer: q.a, key };
    room.buzzWinner = null; room.buzzOpen = false; room.buzzEndsAt = null; room.reveal = false;
    emitRoom(room); cb?.({ ok: true });
  });

  socket.on("markWrong", (_, cb) => {
    const room = findRoom(socket);
    if (!room || room.hostId !== socket.id || !room.current) return cb?.({ ok: false, error: "Nicht möglich." });
    room.buzzWinner = null; room.buzzOpen = true; room.buzzEndsAt = Date.now() + 10000;
    emitRoom(room);
    setTimeout(() => {
      if (rooms.has(room.code) && room.buzzOpen && room.buzzEndsAt && Date.now() >= room.buzzEndsAt) {
        room.buzzOpen = false; room.buzzEndsAt = null; emitRoom(room);
      }
    }, 10050);
    cb?.({ ok: true });
  });

  socket.on("buzz", (_, cb) => {
    const room = findRoom(socket);
    if (!room || !room.buzzOpen || room.buzzWinner || !room.players.has(socket.id)) return cb?.({ ok: false, error: "Buzzer ist gerade geschlossen." });
    if (Date.now() > room.buzzEndsAt) {
      room.buzzOpen = false; room.buzzEndsAt = null; emitRoom(room);
      return cb?.({ ok: false, error: "Die Buzzer-Zeit ist abgelaufen." });
    }
    room.buzzWinner = socket.id; room.buzzOpen = false; room.buzzEndsAt = null;
    emitRoom(room); cb?.({ ok: true });
  });

  socket.on("awardPoints", ({ playerId, delta }, cb) => {
    const room = findRoom(socket);
    if (!room || room.hostId !== socket.id || !room.current) return cb?.({ ok: false, error: "Nicht möglich." });
    const p = room.players.get(playerId);
    if (!p) return cb?.({ ok: false, error: "Spieler nicht gefunden." });
    p.score += Number(delta) || 0; emitRoom(room); cb?.({ ok: true });
  });

  socket.on("revealAnswer", (_, cb) => {
    const room = findRoom(socket);
    if (!room || room.hostId !== socket.id || !room.current) return cb?.({ ok: false });
    room.reveal = true; emitRoom(room); cb?.({ ok: true });
  });

  socket.on("nextQuestion", (_, cb) => {
    const room = findRoom(socket);
    if (!room || room.hostId !== socket.id || !room.current) return cb?.({ ok: false });
    room.used.add(room.current.key); room.current = null; room.buzzWinner = null;
    room.buzzOpen = false; room.buzzEndsAt = null; room.reveal = false;
    emitRoom(room); cb?.({ ok: true });
  });

  socket.on("disconnect", () => {
    const room = findRoom(socket);
    if (!room) return;
    room.players.delete(socket.id);
    if (room.players.size === 0) rooms.delete(room.code);
    else {
      if (room.hostId === socket.id) {
        const next = room.players.values().next().value;
        room.hostId = next.id; next.host = true;
      }
      emitRoom(room);
    }
  });
});

server.listen(PORT, "0.0.0.0", () => console.log(`Quizduell läuft auf http://localhost:${PORT}`));
