// KHA-OS performance agent — serves real system stats to the KHA-OS HUD.
// Run with:  node perf-agent.js   (or double-click start-agent.bat)
// Listens only on localhost; nothing is exposed to the network.
const http = require('http');
const os = require('os');

function cpuTimes() {
  let idle = 0, total = 0;
  for (const c of os.cpus()) {
    for (const k in c.times) total += c.times[k];
    idle += c.times.idle;
  }
  return { idle, total };
}

let last = cpuTimes();
let usage = 0;
setInterval(() => {
  const now = cpuTimes();
  const dIdle = now.idle - last.idle, dTotal = now.total - last.total;
  usage = dTotal > 0 ? Math.round(100 * (1 - dIdle / dTotal)) : 0;
  last = now;
}, 1000);

http.createServer((req, res) => {
  res.writeHead(200, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',   // page is served from github.io
  });
  res.end(JSON.stringify({
    agent: 'khaos',
    cpu: usage,
    cores: os.cpus().length,
    cpuModel: os.cpus()[0].model.trim(),
    ramTotal: os.totalmem(),
    ramFree: os.freemem(),
    uptime: os.uptime(),
    host: os.hostname(),
  }));
}).listen(4525, '127.0.0.1', () => {
  console.log('KHA-OS perf agent online — http://localhost:4525');
});
