import { connection } from "@/config/connection";
import { createSchema, Entity, Field, Inject, Repository } from "mongoose-orm";

@Entity<Location>({
  indexes: [{ fields: { name: "text" } }, { fields: { code: 1, type: 1 } }],
})
export class Location {
  @Field({ type: String, required: true })
  code: string | number;

  @Field()
  name: string;

  @Field()
  provinceCode?: string;

  @Field()
  districtCode?: string;

  @Field()
  wardCode?: string;

  @Field({
    type: String,
    enum: ["province", "district", "ward"],
    required: true,
  })
  type: "province" | "district" | "ward";
}

export const LocationSchema = createSchema(Location);

@Inject<Repository>({ connection, schema: LocationSchema })
export class LocationRepository extends Repository<Location> {}
