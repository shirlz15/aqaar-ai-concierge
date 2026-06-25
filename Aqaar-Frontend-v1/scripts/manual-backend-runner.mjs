import { createServer } from "../../Concierge-Backend-v1/src/server.js";

const port = Number(process.argv[2] || 8080);
const server = await createServer();
server.listen(port, () => {
  console.log(`Manual backend runner listening on http://localhost:${port}`);
});
