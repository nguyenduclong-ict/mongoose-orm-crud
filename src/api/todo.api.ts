import { RequestHandler } from "express";
import { todoRepository } from "../entities/todo";
import { Api } from "../helpers/gateway";

const makeDoneTodo: RequestHandler = (req, res, next) => {
  res.send("done");
};

export default {
  path: "/todo",
  repository: todoRepository,
  routes: {
    "GET /make-done": makeDoneTodo,
  },
} as Api;
