import { connection } from "@/config/connection";
import { IEntity } from "@/helpers/mongoose";
import { SchemaTypes } from "mongoose";
import { createSchema, Entity, Field, Inject, Repository } from "mongoose-orm";
import { Product } from "./Product";
import { Warehouse } from "./Warehouse";

@Entity<Inventory>({})
export class Inventory extends IEntity {
  @Field({ type: SchemaTypes.ObjectId, ref: "Product", required: true })
  product: Product;

  @Field({ type: SchemaTypes.ObjectId, ref: "Warehouse", required: true })
  warehouse: Warehouse;

  @Field({ type: Number, required: true, default: 0 })
  quantity: number;
}

export const InventorySchema = createSchema(Inventory);

@Inject<Repository>({
  connection,
  schema: InventorySchema,
})
export class InventoryRepository extends Repository<Inventory> {}
