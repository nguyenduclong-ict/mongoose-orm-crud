import { SchemaTypes } from "mongoose";
import { createSchema, Entity, Field, Inject, Repository } from "mongoose-orm";
import { connection } from "../helpers/connection";
import { Comment } from "./comment";

@Entity({ timestamps: true })
export class Todo {
  @Field({ type: String, required: true })
  title: string;

  @Field({ type: String, required: true })
  content: string;

  @Field({
    type: [{ type: SchemaTypes.ObjectId, ref: "Comment" }],
    cascade: true,
  })
  comments?: Comment[];

  @Field({ type: String, default: "new" })
  status: "new" | "processing" | "done";
}

export const TodoSchema = createSchema(Todo);

@Inject<Repository>({
  connection: connection,
  schema: TodoSchema,
})
export class TodoRepository extends Repository<Todo> {}

export const todoRepository = new TodoRepository();
