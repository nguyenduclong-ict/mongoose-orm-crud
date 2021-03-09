import { connection } from "@/config/connection";
import { IEntity, SchemaPopulates, Slug } from "@/helpers/mongoose";
import { Document, SchemaTypes } from "mongoose";
import {
  ContextCreate,
  createSchema,
  Entity,
  Field,
  getObjectId,
  Hook,
  Inject,
  Repository,
} from "mongoose-orm";
import { User } from "../account/User";
import { Inventory } from "./Inventory";
import { ProductAttribute } from "./ProductAttribute";
import { ProductCategory } from "./ProductCategory";

export enum ProductTag {
  NEW = "new", // Hàng mới về
  NEW_SEAL = "new_seal", // Hàng nguyên team
  SECONDHAND = "secondhande", // Hàng đã qua sử dụng
}

export enum SaleType {
  ABSOLUTE = "absolute", // Giảm giá trực tiếp
  PERCENT = "percent", // Giảm giá theo phần trăm
}

@Entity<Product>({ owner: true })
export class Product extends IEntity {
  @Field({ type: String, required: true, unique: true })
  name: string;

  @Field({ type: String, required: true, unique: true })
  code: string;

  @Field({
    type: String,
    default: Slug("name", true),
  })
  slug: string;

  @Field({ type: String, required: true })
  image: string;

  @Field({ type: Array, of: String, default: [] })
  images: string[];

  // Danh sách các thuộc tính sản phẩm,
  // ví dụ:
  // - hàng đã qua sử dụng
  // - hàng mới, đang giảm giá v
  @Field({
    type: [String],
    enum: Object.values(ProductTag),
    default: [],
  })
  tags?: ProductTag[];

  @Field({
    type: [
      {
        attribute: { type: SchemaTypes.ObjectId, ref: ProductAttribute.name },
        values: String,
      },
    ],
    default: [],
    ref: ProductAttribute.name,
  })
  attributes?: {
    attribute: ProductAttribute;
    values: string[];
  }[];

  @Field({
    type: Boolean,
    default: false,
  })
  hasVariants: boolean; // Sản phẩm có biến thể hay không

  // Cặp thuộc tính và giá trị của thuộc tính thể hiện biến thể của sản phẩm
  // ví dụ: Màu sắc - Xanh
  @Field({
    type: [
      {
        attribute: { type: SchemaTypes.ObjectId, ref: ProductAttribute.name },
        value: String,
      },
    ],
    default: [],
    ref: ProductAttribute.name,
  })
  variantAttributes?: {
    attribute: ProductAttribute;
    value: string;
  }[];

  @Field({
    type: [{ type: SchemaTypes.ObjectId, ref: ProductCategory.name }],
    default: [],
  })
  categories: ProductCategory[];

  inStock: number; // Số lượng sản phẩm thực có trong kho

  @Field({ type: Number, default: 0 })
  quantity: number; // Số lượng sản phẩm hiển thị với người dùng

  @Field({ type: SchemaTypes.Mixed, default: { solds: 0, likes: 0 } })
  statistics: { solds: number; likes: number }; // Thống kê sản phẩm

  @Field({ type: Number })
  price: number; // Giá bán

  @Field({
    type: Number,
    default: function (self) {
      return self.price;
    },
  })
  importPrice?: number; // Giá nhập, dùng để fill vào phiếu nhập

  @Field({
    type: Number,
    default: function (self) {
      return self.price;
    },
  })
  exportPrice?: number; // Giá nhập, dùng để fill vào phiếu xuất

  @Field({ type: Boolean, default: false })
  onSale: number; // Đang được giảm giá

  @Field({ type: Number, default: 0 })
  saleValue: number;

  @Field({
    type: String,
    enum: Object.values(SaleType),
    default: SaleType.ABSOLUTE,
  })
  saleType: SaleType;

  @Field({ type: SchemaTypes.ObjectId, ref: Product.name })
  parent?: Product;

  children?: Product[]; // Danh sách sản phẩm con
  inventories: Inventory[];

  @Field({ type: SchemaTypes.ObjectId, ref: User.name })
  createdBy?: User;

  @Field({ type: SchemaTypes.ObjectId, ref: User.name })
  updatedBy?: User;
}

export const ProductSchema = createSchema(Product);

ProductSchema.virtual("inStock").get(function () {
  return this.inventories?.reduce(
    (tt: number, item: Inventory) => tt + item.quantity,
    0
  );
});

SchemaPopulates<Product>(ProductSchema, {
  children: {
    ref: "Product",
    localField: "_id",
    foreignField: "parent",
  },
  inventories: {
    ref: "Inventory",
    localField: "_id",
    foreignField: "product",
  },
});

@Inject<Repository>({ connection, schema: ProductSchema })
export class ProductRepository extends Repository<Product> {
  @Hook("before", ["create"])
  beforeCreate(ctx: ContextCreate<Product>) {
    const children = ctx.data.children;
    ctx.data.children = [];
    ctx.meta.children = children;
  }

  @Hook("after", ["create"])
  async afterCreate(ctx: ContextCreate<Product>, response: Product) {
    console.log("product", response);
    try {
      let children: Product[] = ctx.meta.children;
      if (children && children.length) {
        children = (await this.createMany({
          data: children.map((child, index) => {
            child = {
              ...child,
              variantAttributes: child.variantAttributes.map((e) => ({
                attribute: getObjectId(e.attribute),
                value: e.value,
              })),
              code: response.code + "-" + (index + 1),
              image: child.image || response.image,
              parent: response.id,
              categories: response.categories.map(getObjectId),
            } as Product;
            return child;
          }),
          meta: ctx.meta,
        })) as any;
        response.children = children;
      }
      return this.findOne({
        query: { id: response.id },
        populates: ["children"],
      });
    } catch (error) {
      await this.delete({ query: { id: response.id } });
      return null;
    }
  }
}
