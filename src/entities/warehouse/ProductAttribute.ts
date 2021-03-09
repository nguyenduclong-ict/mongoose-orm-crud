import { connection } from "@/config/connection";
import { IEntity, Slug } from "@/helpers/mongoose";
import { SchemaTypes } from "mongoose";
import { createSchema, Entity, Field, Inject, Repository } from "mongoose-orm";
import { User } from "../account/User";

@Entity<ProductAttribute>({
  indexes: [{ fields: { name: "text" } }],
})
export class ProductAttribute extends IEntity {
  @Field({ type: String, unique: true, required: true })
  name: string;

  @Field({ type: String, default: Slug("name") })
  code: string;

  @Field({ type: String })
  description?: string; // Mô tả

  @Field({ type: Array, of: String, default: [], required: true })
  values: string[];

  @Field({ type: SchemaTypes.ObjectId, ref: User.name })
  createdBy?: User;

  @Field({ type: SchemaTypes.ObjectId, ref: User.name })
  updatedBy?: User;
}

export const ProductAttributeSchema = createSchema(ProductAttribute);

@Inject<Repository>({
  connection,
  schema: ProductAttributeSchema,
})
export class ProductAttributeRepository extends Repository<ProductAttribute> {}
