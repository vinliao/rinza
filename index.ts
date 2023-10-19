import { clog, sleep, CastIdSchema } from "@rinza/utils";

CastIdSchema.parse({"hash": "hello", fid: 123})
await sleep(1000)
console.log('slept!')
clog('a', 'b')