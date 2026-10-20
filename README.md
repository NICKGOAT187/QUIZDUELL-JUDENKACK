# Quizduell mit Handy-Buzzern

Multiplayer-Prototyp für 4–10 Spieler: gemeinsames Spielbrett, sechs Kategorien, 30 Demo-Fragen, Spielcode, synchronisierter 10-Sekunden-Buzzer und Host-Steuerung für die Punktevergabe.

## Online bereitstellen (für verschiedene WLANs/PCs)
Diese App benötigt einen laufenden Node.js-Server; eine reine lokale HTML-Datei reicht nicht.

1. Entpacke das ZIP.
2. Lade den Projektordner in ein eigenes GitHub-Repository hoch.
3. Erstelle bei Render einen **Web Service** und verbinde das Repository.
4. Stelle als Build Command `npm install` und als Start Command `npm start` ein.
5. Render stellt eine öffentliche HTTPS-Adresse bereit. Öffnet alle dieselbe Adresse im Browser.
6. Host klickt auf „Spiel erstellen“, teilt den fünfstelligen Code, und die anderen wählen „Beitreten“.

Render dokumentiert Node.js-Webservices und eingehende WebSocket-Verbindungen: https://render.com/docs/web-services und https://render.com/docs/websocket

## Lokal testen
1. Installiere Node.js LTS.
2. Im Projektordner Terminal öffnen und `npm install` ausführen.
3. `npm start` ausführen.
4. Öffne `http://localhost:3000`.

## Wichtige Hinweise
- Bei kostenlosen Hosting-Plänen kann der Server nach Inaktivität schlafen gehen; startet das Spiel rechtzeitig und testet es vorher.
- Die Demo-Fragen sollten vor dem Spieleabend geprüft werden.
- Der Host wählt Fragen aus, zeigt Lösungen an und vergibt Punkte mit den Plus-/Minus-Buttons.
- Die App ist von einem allgemeinen Streamer-Quizformat inspiriert und verwendet keine offiziellen Schmobin-Marken oder Originalmaterialien.
