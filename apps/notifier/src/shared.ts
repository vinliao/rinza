import fs from "fs";
import EventEmitter from "events";

class RollingLog {
	private filename: string;
	private cacheSize: number;
	private cache: string[];

	constructor(filename = "log.ndjson", cacheSize = 250) {
		this.filename = filename;
		this.cacheSize = cacheSize;
		this.cache = [];
		this.initializeCache();
	}

	initializeCache() {
		if (fs.existsSync(this.filename)) {
			const lines = fs.readFileSync(this.filename, "utf8").split("\n");
			this.cache = lines.slice(-this.cacheSize);
		}
	}

	appendLine(line: string) {
		fs.appendFileSync(this.filename, `${line}\n`);
		this.cache.push(line);
		while (this.cache.length > this.cacheSize) {
			this.cache.shift();
		}
	}

	getLatestLines(n: number) {
		return this.cache.slice(-n);
	}
}

class Emitter extends EventEmitter {}

const rollingLog = new RollingLog();
const emitter = new Emitter();

export { rollingLog, emitter };
