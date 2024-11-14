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
        try {
          const cachedPicture = await fs.promises.readFile(image);
          res.writeHead(200, { "Content-Type": "image/jpeg" });
          res.end(cachedPicture);
        } catch (err) {
          try {
            const fetchedPicture = await superagent.get(path);
            await fs.promises.writeFile(image, fetchedPicture.body);
            const cachedPicture = await fs.promises.readFile(image);
            res.writeHead(200, { "Content-Type": "image/jpeg" });
            res.end(cachedPicture);
          } catch {
            res.writeHead(404);
            res.end("Not Found");
          }
        }
        break;

      case "PUT":
        let body = [];
        req.on("data", (chunk) => body.push(chunk));
        req.on("end", async () => {
          body = Buffer.concat(body);
          if (!body.length) {
            res.writeHead(400, { "Content-Type": "text/plain" });
            res.end("No image in request body");
            return;
          }
          try {
            await fs.promises.writeFile(image, body);
            res.writeHead(201, { "Content-Type": "text/plain" });
            res.end("Image saved");
          } catch (err) {
            console.log(`Error saving image: ${err}`);
            res.writeHead(500, { "Content-Type": "text/plain" });
            res.end("Internal Server Error");
          }
        });
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
