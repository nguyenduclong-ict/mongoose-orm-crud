import { todoRepository } from "./entities/todo";
import Express from "express";
import { Gateway } from "./gateway";
import { createServer } from "http";
export const app = Express();
const server = createServer(app);

export const gateway = new Gateway({
  app,
  crud: [{ path: "/todo", repository: todoRepository }],
});

server.listen(5000, () => {
  console.log("Server listen on port ", 5000);
});
