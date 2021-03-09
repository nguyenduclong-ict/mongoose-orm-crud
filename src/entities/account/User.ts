import { connection } from "@/config/connection";
import { IEntity } from "@/helpers/mongoose";
import { SchemaTypes } from "mongoose";
import { createSchema, Entity, Field, Inject, Repository } from "mongoose-orm";
import { Role } from "./Role";

@Entity<User>()
export class User extends IEntity {
  @Field({ type: String, unique: true })
  username: string;

  @Field({ type: String, required: true })
  password: string;

  @Field()
  email: string;

  @Field()
  phone: string;

  @Field()
  facebookId: string;

  @Field({ type: Boolean, default: false })
  blocked: boolean;

  @Field({ type: Boolean, default: false })
  isAdmin?: boolean;

  @Field({ type: SchemaTypes.Mixed, default: {} })
  profile: {
    name?: string;
    gender?: "male" | "female";
    avatar: string;
  };

  @Field({
    type: [{ type: SchemaTypes.ObjectId, ref: Role.name }],
    default: [],
  })
  roles: Role[];
}

export const UserSchema = createSchema(User);

@Inject<Repository>({ connection: connection, schema: UserSchema })
export class UserRepository extends Repository<User> {
  fetchUser(id: any) {
    return this.findOne({
      query: {
        _id: id,
      },
      populates: ["roles"],
    });
  }
}
