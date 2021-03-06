import { commentRepository } from "entities/comment";
import { Api } from "helpers/gateway";

export default {
  path: "/comment",
  repository: commentRepository,
} as Api;
