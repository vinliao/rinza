import express from "express";
import cors from "cors";
import { emitter } from "./singletons";
import http from "http";
import { Server } from "socket.io";
import { NotifierEventType } from "@rinza/farcaster-hooks";

import sqlite from "better-sqlite3";
const db = new sqlite("log.db");

const app = express();
const port = Number(process.env.PORT) || 3000;
const server = http.createServer(app);
const io = new Server(server, {
	cors: {
		origin: "*",
	},
});

// TODO: should only be enabled in dev!
app.use(cors());

app.get("/", (req, res) => {
	res.send({ message: "Hello, world!" });
});

io.on("connection", (socket) => {
	const stmt = db.prepare(
		"SELECT * FROM events ORDER BY timestamp DESC LIMIT 10",
	);
	const lastTenLogs = stmt.all();
	socket.emit("initialLogs", JSON.stringify(lastTenLogs));

	const sendEventToClient = (data: NotifierEventType) => {
		socket.emit("event", JSON.stringify(data));
	};

	emitter.on("all-event", sendEventToClient);
	socket.on("disconnect", () => {
		emitter.off("all-event", sendEventToClient);
		console.log("Client disconnected");
	});
});

app.get("/logs", (req, res) => {
	const stmt = db.prepare(
		"SELECT * FROM events ORDER BY timestamp DESC LIMIT 10",
	);
	const lastTenLogs = stmt.all();
	res.send(lastTenLogs);
});

server.listen(port, () => {
	console.log(`Example app listening at http://localhost:${port}`);
});

// TODO: listen cast reply mention
