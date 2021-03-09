import { connection } from "@/config/connection";
import { IEntity } from "@/helpers/mongoose";
import { Document, SchemaTypes } from "mongoose";
import { createSchema, Entity, Field, Inject, Repository } from "mongoose-orm";
import { Address } from "../account/Address";
import { User } from "../account/User";

@Entity<Warehouse>({
  owner: true,
  indexes: [{ fields: { name: "text" } }],
})
export class Warehouse extends IEntity {
  @Field({ type: String, required: true })
  name: string;

  @Field({ type: SchemaTypes.ObjectId, ref: Address.name, cascade: true })
  address: Address;

  @Field({ type: Boolean })
  isPrimary: boolean;

  @Field({ type: SchemaTypes.ObjectId, ref: User.name })
  createdBy: User;

  @Field({ type: SchemaTypes.ObjectId, ref: User.name })
  updatedBy?: User;
}

export const WarehouseSchema = createSchema(Warehouse);

@Inject<Repository>({ connection, schema: WarehouseSchema })
export class WarehouseRepository extends Repository<Warehouse> {}
