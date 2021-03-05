import { connection } from "../helpers/connection";
import { createSchema, Entity, Field, Inject, Repository } from "mongoose-orm";

@Entity({ timestamps: true })
export class Todo {
  @Field()
  title: string;

  @Field()
  content: string;
}

export const PhotoSchema = createSchema(Todo);

@Inject<Repository>({
  connection: connection,
  schema: PhotoSchema,
})
export class TodoRepository extends Repository<Todo> {}

export const todoRepository = new TodoRepository();
