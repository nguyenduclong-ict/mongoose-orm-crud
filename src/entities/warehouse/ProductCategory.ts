import { connection } from "@/config/connection";
import { IEntity, SchemaPopulates, Slug } from "@/helpers/mongoose";
import { SchemaTypes } from "mongoose";
import { createSchema, Entity, Field, Inject, Repository } from "mongoose-orm";

@Entity<ProductCategory>({
  timestamps: true,
  indexes: [{ fields: { name: "text" } }],
})
export class ProductCategory extends IEntity {
  @Field({ type: String, required: true })
  name: string;

  @Field({
    type: String,
    unique: true,
    default: Slug("name"),
  })
  slug: string;

  @Field({ type: String })
  description: string;

  @Field({ type: SchemaTypes.ObjectId, ref: ProductCategory.name })
  parent?: ProductCategory;

  children?: ProductCategory[];

  @Field({ type: Number, default: 0 })
  productCounts: number;

  @Field({ type: Number, default: 0 })
  order: number;
}

export const ProductCategorySchema = createSchema(ProductCategory);

SchemaPopulates<ProductCategory>(ProductCategorySchema, {
  children: {
    ref: ProductCategory.name,
    foreignField: "parent",
    localField: "_id",
    justOne: false,
  },
});

@Inject<Repository>({ connection, schema: ProductCategorySchema })
export class ProductCategoryRepository extends Repository<ProductCategory> {}
