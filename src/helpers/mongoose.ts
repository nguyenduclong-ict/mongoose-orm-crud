import {
  Repository,
  KEYS,
  ContextCreate,
  ContextCreateMany,
} from "mongoose-orm";
import _ from "lodash";
import { DocumentDefinition } from "mongoose";
import slugify from "slugify";

export const Slug = (
  fields: string | string[],
  randomId = false,
  check: any = null
) => {
  return function (this: any) {
    if (check && !check(this)) return;
    if (typeof fields === "string") fields = [fields];
    let slug = fields
      .map((field) => slugify(_.get(this, field), { lower: true }))
      .join("-");
    if (randomId) {
      slug += "-" + Math.random().toString(36).slice(2, 8);
    }
    return slug;
  };
};

export interface PopulateOptions<E> {
  ref: string;
  localField: keyof DocumentDefinition<E>;
  foreignField: string;
  justOne?: boolean;
  match?: any;
}

export function SchemaPopulates<E>(
  schema: any,
  populates: { [x in keyof DocumentDefinition<E>]?: PopulateOptions<E> }
) {
  for (const key in populates) {
    if (Object.prototype.hasOwnProperty.call(populates, key)) {
      // @ts-ignore
      schema.virtual(key, populates[key]);
    }
  }
}

export class IEntity {
  _id?: any;
  id?: any;
}

export function getEntityForm(repository: Repository) {
  const options = _.get(repository.schema, KEYS.SCHEMA_PATHS);
  const result: any = {};
  Object.keys(options).forEach((key) => {
    const field: any = {};
    let origin;
    let isArray = Array.isArray(options[key]);
    origin = isArray ? options[key][0] : options[key];
    if (isArray || Array.isArray(origin.type)) {
      field.type = "Array";
    } else {
      field.type = (origin.type?.type || origin.type)?.name;
    }
    field.type = field.type || "String";
    field.ref = origin.type?.ref || origin.ref;
    Object.assign(
      field,
      _.pick(
        origin,
        "required",
        "max",
        "min",
        "maxlength",
        "minlength",
        "enum",
        "default",
        "validator",
        "unique"
      )
    );
    result[key] = field;
  });
  return result;
}

// Register global hooks
Repository.registerHook("before", ["create"], function (ctx: ContextCreate) {
  const options = this.schema[KEYS.SCHEMA_OPTIONS];
  if (options.owner) ctx.data.createdBy = ctx.meta?.user?.id;
});
Repository.registerHook(
  "before",
  ["createMany"],
  function (ctx: ContextCreateMany) {
    const options = this.schema[KEYS.SCHEMA_OPTIONS];
    if (options.owner)
      ctx.data.forEach((entity) => {
        entity.createdBy = ctx.meta?.user?.id;
      });
  }
);
Repository.registerHook(
  "before",
  ["update", "updateOne"],
  function (ctx: ContextCreate) {
    const options = this.schema[KEYS.SCHEMA_OPTIONS];
    if (options.owner) ctx.data.updatedBy = ctx.meta?.user?.id;
  }
);
