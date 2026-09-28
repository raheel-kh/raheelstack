const express = require("express");
const server = require("http").createServer();
const app = express();

app.get("/", function (req, res) {
  res.sendFile("index.html", { root: __dirname });
});

server.on("request", app);
server.listen(3000, function () {
  console.log("server started on port 3000");
});

process.on("SIGINT", () => {
  console.log("sigint");

  const totalClients = wss.clients.size;

  if (totalClients === 0) {
    // If no one is connected, run shutdown sequence immediately
    shutdownDB();
  } else {
    // Disconnect clients and let their ws.on("close") events print first
    wss.clients.forEach(function each(client) {
      client.close();
    });

    // Wait 100 milliseconds for the disconnection logs to finish printing
    setTimeout(() => {
      shutdownDB();
    }, 100);
  }
});

/** Begin Websockets */
const WebSocketServer = require("ws").Server;
const wss = new WebSocketServer({ server: server });

wss.broadcast = function broadcast(data) {
  wss.clients.forEach(function each(client) {
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

  db.run(`INSERT INTO visitors (count, time) 
  VALUES (${numClients}, datetime('now'))
  `);

  ws.on("close", function close() {
    const currentCount = wss.clients.size;
    wss.broadcast(`Current visitors: ${currentCount}`);
    console.log("A client has disconnected. Remaining:", currentCount);
  });
});

/** End websockets */
/** Begin Database */
const sqlite = require("sqlite3");
const db = new sqlite.Database(":memory:");

db.serialize(() => {
  db.run(`
    CREATE TABLE visitors (
      count INTEGER,
      time TEXT
    )
  `);
});

function getCounts(callback) {
  db.all("SELECT * FROM visitors", (err, rows) => {
    if (!err && rows) {
      rows.forEach((row) => {
        console.log(row); // Prints database {count: ...} objects next
      });
    }
    callback(); // Triggers the next step in line
  });
}

function shutdownDB() {
  getCounts(() => {
    console.log("Shutting down db"); // Prints dead last right before closing
    db.close(() => {
      process.exit(0); // Safely forces the terminal process to end
    });
  });
}
