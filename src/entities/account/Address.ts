import { connection } from "@/config/connection";
import { SchemaPopulates } from "@/helpers/mongoose";
import { SchemaTypes } from "mongoose";
import {
  ContextCreate,
  createSchema,
  Entity,
  Field,
  Hook,
  Inject,
  Repository,
} from "mongoose-orm";
import { locationRepository } from ".";
import { Location } from "./Location";
import { User } from "./User";

@Entity<Address>({ owner: true })
export class Address {
  @Field({ type: String })
  provinceCode: string;

  province?: Location;

  @Field({ type: String })
  districtCode: string;

  district?: Location;

  @Field({ type: String })
  wardCode: string;

  ward?: Location;

  @Field({ type: String })
  street: string;

  @Field({ type: String })
  text: string; // full address text, update on create or update

  @Field({ type: Boolean })
  isPrimary: boolean;

  @Field({ type: String })
  name: string;

  @Field({ type: String })
  phone: string;

  @Field({ type: SchemaTypes.ObjectId, ref: User.name })
  createdBy?: User;

  @Field({ type: SchemaTypes.ObjectId, ref: User.name })
  updatedBy?: User;
}

export const AddressSchema = createSchema(Address);

SchemaPopulates<Address>(AddressSchema, {
  province: {
    ref: Location.name,
    localField: "provinceCode",
    foreignField: "code",
    justOne: true,
    match: {
      type: "province",
    },
  },
  district: {
    ref: Location.name,
    localField: "districtCode",
    foreignField: "code",
    justOne: true,
    match: {
      type: "district",
    },
  },
  ward: {
    ref: Location.name,
    localField: "wardCode",
    foreignField: "code",
    justOne: true,
    match: {
      type: "ward",
    },
  },
});

@Inject<Repository>({ connection, schema: AddressSchema })
export class AddressRepository extends Repository<Address> {
  @Hook("before", ["create", "update", "updateOne"])
  async beforeCreateOrUpdate(ctx: ContextCreate<Address>) {
    if (!ctx.data) return;
    if (Array.isArray(ctx.data)) {
      await Promise.all(
        ctx.data.map(async (item) => {
          item.text = await this.getAddressText(item);
        })
      );
    } else {
      ctx.data.text = await this.getAddressText(ctx.data);
    }
  }

  async getAddressText(data: Address): Promise<string> {
    const [province, district, ward] = await Promise.all([
      locationRepository.findOne({
        query: { code: data.provinceCode || null },
      }),
      locationRepository.findOne({
        query: { code: data.districtCode || null },
      }),
      locationRepository.findOne({ query: { code: data.wardCode || null } }),
    ]);

    return [(data.street, ward.name, district.name, province.name)]
      .filter((e) => !!e)
      .join(", ");
  }
}
