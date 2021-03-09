import { connection } from "@/config/connection";
import { IEntity } from "@/helpers/mongoose";
import { SchemaTypes } from "mongoose";
import { createSchema, Entity, Field, Inject, Repository } from "mongoose-orm";

@Entity<Config>({})
export class Config extends IEntity {
  @Field()
  key: string;

  @Field({
    type: SchemaTypes.Mixed,
  })
  value: any;
}

export const ConfigSchema = createSchema(Config);

@Inject<Repository>({ connection, schema: ConfigSchema })
export class ConfigRepository extends Repository<Config> {}
