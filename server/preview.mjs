import { createServer } from 'node:http';
import { createReadStream, existsSync, statSync } from 'node:fs';
import { resolve, extname, sep } from 'node:path';
const root = resolve('dist');
if (!existsSync(root)) throw new Error('Run npm run build:web first');
const types = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml', '.ttf': 'font/ttf', '.json': 'application/json', '.ico': 'image/x-icon', '.wasm': 'application/wasm' };
createServer((req, res) => {
  let pathname;
  try { pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname); } catch { res.writeHead(400); return res.end(); }
  let file = resolve(root, '.' + pathname);
  if (!file.startsWith(root + sep) && file !== root) { res.writeHead(403); return res.end(); }
  if (existsSync(file) && statSync(file).isDirectory()) file = resolve(file, 'index.html');
  if (!existsSync(file)) file = existsSync(file + '.html') ? file + '.html' : resolve(root, 'index.html');
  res.setHeader('Content-Type', `${types[extname(file)] || 'application/octet-stream'}${extname(file) === '.html' ? '; charset=utf-8' : ''}`);
  createReadStream(file).on('error', () => { res.statusCode = 500; res.end(); }).pipe(res);
}).listen(Number(process.env.PREVIEW_PORT || 4173), '127.0.0.1', () => console.log('Preview http://localhost:4173'));
