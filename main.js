const http = require("http");
const { Command } = require("commander");
const fs = require("node:fs");
const superagent = require("superagent");
const program = new Command();

program
  .requiredOption("-h, --host <host>", "server host")
  .requiredOption("-p, --port <port>", "server port")
  .requiredOption("-c, --cache <cache>", "cache directory")
  .parse(process.argv);

const { host, port, cache } = program.opts();

if (!host) {
  console.error("Error: input host");
  return;
}

if (!port) {
  console.error("Error: input port");
  return;
}

if (!cache) {
  console.error("Error: input cache");
  return;
}

const server = http.createServer(async (req, res) => {
  const path = `https://http.cat/${req.url}.jpg`;
  const image = `${cache}${req.url}.jpg`;

  try {
    switch (req.method) {
      case "GET":
        const cachedPicture = await fs.promises.readFile(image);
        res.writeHead(200, { "Content-Type": "image/jpeg" });
        res.end(cachedPicture);
        break;

      case "PUT":
        const fetchedPicture = await superagent.get(path);
        await fs.promises.writeFile(image, fetchedPicture.body);
        res.writeHead(201);
        res.end();
        break;

      case "DELETE":
        await fs.promises.rm(image, { force: true });
        res.writeHead(200);
        res.end();
        break;

      default:
        res.writeHead(405);
        res.end();
    }
  } catch (error) {
    res.writeHead(404);
    res.end("Error with processing the request");
  }
});

server.listen(port, host, () => {
  console.log(`Server running at http://${host}:${port}/`);
});
