import express from "express";
import cors from "cors";
import { emitter } from "./singletons";
import http from "http";
import { Server } from "socket.io";
import { NotifierEventType } from "@rinza/utils";
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
	const sendEventToClient = (data: NotifierEventType) => {
		socket.emit("merge-message", JSON.stringify(data));
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
