import { connection } from "@/config/connection";
import { SchemaTypes } from "mongoose";
import { createSchema, Entity, Field, Inject, Repository } from "mongoose-orm";
import urljoin from "url-join";
import { User } from "./User";

export enum MediaSource {
  LOCAL = "local",
  EXTERNAL = "external",
}

@Entity<Media>({
  indexes: [{ fields: { name: "text" } }],
  timestamps: true,
  owner: true,
})
export class Media {
  @Field({ type: String })
  name: string;

  url?: string;

  @Field({ type: String })
  src?: string; // source for firebase

  @Field({ type: String })
  path?: string; // path to local

  @Field({ type: SchemaTypes.Mixed })
  meta?: { alt: string; description: string };

  @Field({ type: String, enum: Object.values(MediaSource) })
  type: MediaSource;

  @Field({ type: SchemaTypes.ObjectId, ref: User.name })
  createdBy?: User;

  @Field({ type: SchemaTypes.ObjectId, ref: User.name })
  updatedBy?: User;
}

export const MediaSchema = createSchema(Media);

MediaSchema.virtual("url").get(function (this: any) {
  if (this.type === MediaSource.LOCAL)
    return urljoin(process.env.SERVER_URL, "upload", this.path);
  if (this.type === MediaSource.EXTERNAL) return this.src;
});

@Inject<Repository>({ connection, schema: MediaSchema })
export class MediaRepository extends Repository<Media> {}
