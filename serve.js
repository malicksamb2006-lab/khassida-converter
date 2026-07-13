const http = require('http');
const fs = require('fs/promises');
const path = require('path');

const argPort = process.argv.find((arg) => arg.startsWith('--port='));
const port = argPort ? Number(argPort.split('=')[1]) : Number(process.env.PORT) || 3000;
const root = path.resolve(__dirname);

const mimeTypes = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.otf': 'font/otf'
};

function getContentType(filePath) {
  return mimeTypes[path.extname(filePath).toLowerCase()] || 'application/octet-stream';
}

async function serveFile(filePath, response) {
  try {
    const data = await fs.readFile(filePath);
    response.writeHead(200, { 'Content-Type': getContentType(filePath) });
    response.end(data);
  } catch (error) {
    response.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    response.end('404 Not Found');
  }
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  let pathname = decodeURIComponent(url.pathname);
  if (pathname === '/') pathname = '/index.html';

  const filePath = path.join(root, pathname);
  const normalized = path.normalize(filePath);
  if (!normalized.startsWith(root)) {
    res.writeHead(400, { 'Content-Type': 'text/plain; charset=utf-8' });
    return res.end('Bad Request');
  }

  await serveFile(normalized, res);
});

server.on('error', (error) => {
  if (error.code === 'EADDRINUSE') {
    console.error(`Le port ${port} est déjà utilisé. Fermez l'autre serveur ou lancez avec PORT=<autre_port> node serve.js`);
    process.exit(1);
  }
  console.error('Erreur serveur :', error);
  process.exit(1);
});

server.listen(port, () => {
  console.log(`Serveur local démarré sur http://localhost:${port}`);
});
