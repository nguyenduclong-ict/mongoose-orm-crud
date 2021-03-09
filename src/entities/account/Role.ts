import { connection } from "@/config/connection";
import { createSchema, Entity, Field, Inject, Repository } from "mongoose-orm";
import { IEntity } from "@/helpers/mongoose";

@Entity<Role>({})
export class Role extends IEntity {
  @Field({ type: String, required: true })
  name: string;

  @Field({ type: String, required: true, unique: true })
  code: string;
}

export const RoleSchema = createSchema(Role);

@Inject<Repository>({ connection, schema: RoleSchema })
export class RoleRepository extends Repository<Role> {}
