import { todoRepository } from "../entities/todo";
import { Api } from "../helpers/gateway";

export default {
  path: "/todo",
  repository: todoRepository,
} as Api;
