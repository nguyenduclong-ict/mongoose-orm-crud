import express from "express";
import { createServer } from "http";
import { commentRepository } from "./entities/comment";
import { todoRepository } from "./entities/todo";
import { HandleRequestError } from "./helpers/error";
import { Gateway } from "./helpers/gateway";
import morgan from "morgan";
export const app = express();
app.use(morgan("dev"));
app.use(express.json());
app.get("/", (req, res) => {
  res.send("sever work!");
});
export const gateway = new Gateway({
  app,
  crud: [
    {
      path: "/todo",
      repository: todoRepository,
      methods: [
        "create",
        "update",
        "delete",
        "deleteOne",
        {
          // custom
          name: "list",
          middlewares: [
            (req, res, next) => {
              // Example set max pageSize
              if (Number(req.query.pageSize) > 100) {
                (req.query as any).pageSize = 100;
              }
              next();
            },
          ],
        },
      ],
    },
    {
      path: "/comment",
      repository: commentRepository,
    },
  ],
});
const server = createServer(app);
app.use(HandleRequestError);
server.listen(process.env.PORT || 5000, () => {
  console.log("Server listen on port ", 5000);
});
