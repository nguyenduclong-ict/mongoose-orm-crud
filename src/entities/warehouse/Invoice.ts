import { E } from "@/config";
import { connection } from "@/config/connection";
import { IEntity } from "@/helpers/mongoose";
import { SchemaTypes } from "mongoose";
import {
  ContextCreate,
  ContextUpdate,
  createSchema,
  Entity,
  Field,
  getObjectId,
  Hook,
  Inject,
  Repository,
} from "mongoose-orm";
import { User } from "../account/User";
import { inventoryRepository, productRepository } from "./index";
import { Product } from "./Product";
import { Warehouse } from "./Warehouse";

export enum InvoiceStatus {
  DRAFT = "draft",
  SUCCESS = "success",
  CANCEL = "cancel",
}

export enum InvoiceType {
  IMPORT = "import",
  EXPORT = "export",
}

@Entity<Invoice>({})
export class Invoice extends IEntity {
  @Field({ type: Number, required: true })
  price: number;

  @Field({ type: SchemaTypes.ObjectId, ref: Warehouse.name, required: true })
  product: Product;

  @Field({ type: Number, required: true, min: 0 })
  quantity: number;

  @Field({ type: SchemaTypes.ObjectId, ref: Warehouse.name, required: true })
  warehouse: Warehouse;

  @Field({ type: String, enum: Object.values(InvoiceStatus), required: true })
  status: InvoiceStatus;

  @Field({ type: String, enum: Object.values(InvoiceType), required: true })
  type: InvoiceType;

  @Field({ type: SchemaTypes.ObjectId, ref: User.name })
  createdBy?: User;

  @Field({ type: SchemaTypes.ObjectId, ref: User.name })
  updatedBy?: User;

  @Field({
    type: [
      {
        status: String,
        note: String,
        createdAt: Date,
        createdBy: SchemaTypes.ObjectId,
      },
    ],
    default: [],
  })
  histories: {
    status: InvoiceStatus;
    note?: string;
    createdAt: Date;
    createdBy: User;
  }[];

  createdAt?: Date;
  updatedAt?: Date;
}

export const InvoiceSchema = createSchema(Invoice);

@Inject<Repository>({ connection, schema: InvoiceSchema })
export class InvoiceRepository extends Repository<Invoice> {
  @Hook("before", ["updateOne"])
  async beforeUpdate(ctx: ContextUpdate<Invoice>) {
    const invoice = await this.findOne({ query: ctx.query });
    if (!invoice) {
      throw E.NotFound();
    }
    if (ctx.data.status === InvoiceStatus.CANCEL) {
      throw E.Error(400, "Cannot update invoice");
    }
  }

  @Hook("after", ["create", "updateOne"])
  async incQuantity(ctx: ContextCreate<Invoice>, response: Invoice) {
    const getQuantityForUpdate = (invoice: Invoice) =>
      invoice.type === InvoiceType.IMPORT
        ? Math.abs(invoice.quantity)
        : -Math.abs(invoice.quantity);
    if (_.last(response.histories)?.status !== response.status) {
      if (response.status === InvoiceStatus.SUCCESS) {
        await Promise.all([
          inventoryRepository
            .findOne({
              query: { product: getObjectId(response.product) },
            })
            .then((item) => {
              if (!item)
                return inventoryRepository.create({
                  data: {
                    product: getObjectId(response.product),
                    quantity: getQuantityForUpdate(response),
                    warehouse: getObjectId(response.warehouse),
                  },
                });
              else
                return inventoryRepository.updateOne({
                  query: {
                    product: getObjectId(response.product),
                  },
                  data: {
                    $inc: {
                      quantity: getQuantityForUpdate(response),
                    },
                  },
                });
            }),

          productRepository.updateOne({
            query: {
              id: getObjectId(response.product),
            },
            data: {
              $inc: {
                quantity: getQuantityForUpdate(response),
              },
            },
          }),
        ]);
      }

      response = await this.updateOne({
        query: {
          id: getObjectId(response.id),
        },
        data: {
          $push: {
            histories: {
              status: response.status,
              createdAt: new Date(),
              createdBy: getObjectId(ctx.meta.user),
            },
          },
        },
        populates: ctx.populates,
      });
    }
    return response;
  }
}
