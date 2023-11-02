import express from "express";
import cors from "cors";
import { emitter } from "./singletons";
import http from "http";
import { Server } from "socket.io";
import { NotifierEventType } from "@rinza/farcaster-hooks";
import sqlite from "better-sqlite3";

const db = new sqlite("log.sqlite");
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
		"SELECT * FROM events ORDER BY timestamp DESC LIMIT 100",
	);
	const lastTenLogs = stmt.all();
	socket.emit("initial-logs", JSON.stringify(lastTenLogs));

	const sendEventToClient = (data: NotifierEventType) => {
		const messages = [
			"merge-message",
			`merge-message-type-${data.type}`,
			`merge-message-fid-${data.fid}`,
			`merge-message-fid-${data.fid}-type-${data.type}`,
		];

		messages.map((message) => {
			socket.emit(message, JSON.stringify(data));
		});

		// if(data.type === 3) {
		//   socket.emit(`cast-fid-${data.fid}`, JSON.stringify(data));
		// }
	};
	emitter.on("merge-message", sendEventToClient);

	socket.on("disconnect", () => {
		emitter.off("merge-message", sendEventToClient);
		console.log("Client disconnected");
	});
});

app.get("/logs", (req, res) => {
	let limit = 25;
	if (typeof req.query.limit === "string") {
		limit = Math.min(parseInt(req.query.limit) || 25, 100);
	}
	const stmt = db.prepare(
		"SELECT * FROM events ORDER BY timestamp DESC LIMIT ?",
	);
	const lastLogs = stmt.all(limit);
	res.send(lastLogs);
});

server.listen(port, () => {
	console.log(`Example app listening at http://localhost:${port}`);
});

// TODO: listen cast reply mention
