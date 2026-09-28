const express = require("express");
const server = require("http").createServer();
const app = express();

app.get("/", function (req, res) {
  res.sendFile("index.html", { root: __dirname });
});

server.on("request", app);
server.listen(3000, function () {
  console.log("server started on port 3000"); // Fixed typo in console log
});

/** Begin Websockets */
const WebSocketServer = require("ws").Server;
const wss = new WebSocketServer({ server: server });

// Move the helper function here so it's ready before connection events trigger
wss.broadcast = function broadcast(data) {
  wss.clients.forEach(function each(client) {
    // Only send if the client connection is actively open
    if (client.readyState === client.OPEN) {
      client.send(data);
    }
  });
};

wss.on("connection", function connection(ws) {
  const numClients = wss.clients.size;
  console.log("Clients connected", numClients);

  wss.broadcast(`Current visitors: ${numClients}`);

  if (ws.readyState === ws.OPEN) {
    ws.send("Welcome to my server");
  }

  ws.on("close", function close() {
    // FIX 1: Recalculate size to get the accurate updated count
    const currentCount = wss.clients.size;

    // FIX 2: Use wss instead of ws
    wss.broadcast(`Current visitors: ${currentCount}`);
    console.log("A client has disconnected. Remaining:", currentCount);
  });
});
