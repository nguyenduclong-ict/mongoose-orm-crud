import { connection } from "../helpers/connection";
import { createSchema, Entity, Field, Inject, Repository } from "mongoose-orm";

@Entity({ timestamps: true })
export class Comment {
  @Field({ required: true })
  user: string;

  @Field({ required: true })
  text: string;
}

export const CommentSchema = createSchema(Comment);

@Inject<Repository>({
  connection: connection,
  schema: CommentSchema,
})
export class CommentRepository extends Repository<Comment> {}

export const commentRepository = new CommentRepository();
