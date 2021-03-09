import { Express, RequestHandler, Router, text } from "express";
import globby from "globby";
import { Repository } from "mongoose-orm";
import { ERROR_CODES, RequestError } from "./error";
import { getEntityForm } from "./mongoose";

// prettier-ignore
const gSpace = (txt: string, length: number) => txt + new Array(Math.max(0, length - txt.length)).fill(" ").join("");

export interface Api {
  path: string;
  repository?: Repository;
  crudMethods?: (
    | CrudMethod
    | {
        name: CrudMethod;
        middlewares: RequestHandler[];
      }
  )[];
  middlewares?: RequestHandler[];
  routes?: {
    [x: string]: RequestHandler | RequestHandler[];
  };
  router?: Router;
}

export function Api(data: Api | Api[]) {
  return data;
}

const parseQuery = (req: any, res: any, next: any) => {
  const query = req.query;
  Object.keys(query).forEach((key) => {
    if (
      typeof query[key] === "string" &&
      (key === "query" ||
        key === "populates" ||
        key === "page" ||
        key === "pageSize" ||
        key === "projection" ||
        key === "softDelete" ||
        key === "select")
    ) {
      try {
        query[key] = JSON.parse(query[key]);
      } catch (error) {}
    }
  });
  next();
};

const log = {
  register: (
    method: "GET" | "POST" | "PUT" | "DELETE",
    item: any,
    path: string,
    action: string
  ) => {
    console.log(
      "%s %s => %s.%s",
      gSpace(method, 7).toUpperCase().cyan,
      (item.path + path).replace(/\/$/, "").green,
      item.repository.name.cyan,
      action.cyan
    );
  },
  error(
    method: "GET" | "POST" | "PUT" | "DELETE",
    item: any,
    path: string,
    action: string,
    error: any
  ) {
    console.error(
      "%s %s => %s.%s",
      method.cyan,
      (item.path + path).replace(/\/$/, "").green,
      item.repository.name.cyan,
      action.cyan,
      error
    );
  },
};

const vError = (rs: any) =>
  new RequestError(422, rs.errors[0]?.message, {
    data: rs.errors,
    code: ERROR_CODES.VALIDATOR_ERROR,
  });

// prettier-ignore
type CrudMethod = "list"| "find"| "findOne"| "create"| "bulkCreate"| "update"| "updateOne"| "delete"| "deleteOne"| "schema";

export class Gateway {
  app: Express;
  apis: Api[] = [];

  constructor(app: Express) {
    this.app = app;
    return this;
  }

  registerCrud(api: Api) {
    const methods = api.crudMethods || [
      "list",
      "find",
      "findOne",
      "create",
      "bulkCreate",
      "update",
      "updateOne",
      "delete",
      "deleteOne",
      "schema",
    ];
    const repository = api.repository;
    const router = api.router;

    const has = (name: string) =>
      methods.find((item) => item === name || (item as any).name === name);

    const h: { [k in CrudMethod]: any } = {} as any;

    if ((h.list = has("list"))) {
      const mds = h.list.middlewares || [];
      router.get("/", parseQuery, ...mds, (req, res, next) => {
        const ctx = { ...(req.query as any), meta: req.meta };
        if (req.query.search) {
          let text = _.has(req.query, "exact")
            ? '"' + req.query.search + '"'
            : req.query.search;
          _.set(ctx, "query.$text.$search", text);
        }
        return repository
          .list(ctx)
          .then((data) => res.json(data))
          .catch((error) => {
            log.error("GET", api, "/", "list", error);
            next(error);
          });
      });
      log.register("GET", api, "/", "list");
    }
    if ((h.find = has("find"))) {
      const mds = h.find.middlewares || [];
      router.get("/find", parseQuery, ...mds, (req, res, next) => {
        const ctx = { ...(req.query as any), meta: req.meta };
        if (req.query.search) {
          let text = _.has(req.query, "exact")
            ? '"' + req.query.search + '"'
            : req.query.search;
          _.set(ctx, "query.$text.$search", text);
        }
        return repository
          .find(ctx)
          .then((data) => res.json(data))
          .catch((error) => {
            log.error("GET", api, "/find", "find", error);
            next(error);
          });
      });
      log.register("GET", api, "/find", "find");
    }

    if ((h.findOne = has("findOne"))) {
      const mds = h.findOne.middlewares || [];
      router.get("/find-one", parseQuery, ...mds, (req, res, next) => {
        const ctx = { ...(req.query as any), meta: req.meta };
        if (req.query.search) {
          let text = _.has(req.query, "exact")
            ? '"' + req.query.search + '"'
            : req.query.search;
          _.set(ctx, "query.$text.$search", text);
        }
        return repository
          .findOne(ctx)
          .then((data) => res.json(data))
          .catch((error) => {
            log.error("GET", api, "/find-one", "findOne", error);
            next(error);
          });
      });
      log.register("GET", api, "/find-one", "findOne");
    }

    if ((h.create = has("create"))) {
      const mds = h.create.middlewares || [];
      router.post("/", ...mds, async (req, res, next) => {
        try {
          const data = req.body.data;
          const validateResult = await repository.validateEntity(data);
          if (!validateResult.valid) {
            return next(vError(validateResult));
          }
          const response = await repository.create({
            ...req.body,
            meta: req.meta,
          });
          return res.json(response);
        } catch (error) {
          log.error("POST", api, "/", "create", error);
          next(error);
        }
      });
      log.register("POST", api, "/", "createOne");
    }

    if ((h.bulkCreate = has("bulkCreate"))) {
      const mds = h.bulkCreate.middlewares || [];
      router.post("/bulk-create", ...mds, async (req, res, next) => {
        try {
          const data = req.body.data;
          if (!data || !Array.isArray(data)) {
            return next(new RequestError(422, "data must be array"));
          }
          for (let index = 0; index < data.length; index++) {
            const entity = data[index];
            const validateResult = await repository.validateEntity(entity);
            if (!validateResult.valid) {
              return next(vError(validateResult));
            }
          }
          const response = await repository.createMany({
            ...req.body,
            meta: req.meta,
          });
          return res.json(response);
        } catch (error) {
          log.error("POST", api, "/bulk-create", "bulkCreate", error);
          next(error);
        }
      });
      log.register("POST", api, "/bulk-create", "create");
    }

    if ((h.update = has("update"))) {
      const mds = h.update.middlewares || [];
      router.put("/", ...mds, async (req, res, next) => {
        try {
          const response = await repository.update({
            ...req.body,
            meta: req.meta,
          });
          return res.json(response);
        } catch (error) {
          log.error("POST", api, "/", "update", error);
          next(error);
        }
      });
      log.register("PUT", api, "/", "update");
    }

    if ((h.updateOne = has("updateOne"))) {
      const mds = h.updateOne.middlewares || [];
      router.put("/:id", ...mds, async (req, res, next) => {
        try {
          const data = await repository.updateOne({
            ...req.body,
            query: {
              id: req.params.id,
            },
            meta: req.meta,
          });
          return res.json(data);
        } catch (error) {
          log.error("PUT", api, "/:id", "updateOne", error);
          next(error);
        }
      });
      log.register("PUT", api, "/:id", "updateOne");
    }

    if ((h.delete = has("delete"))) {
      const mds = h.delete.middlewares || [];
      router.delete("/", ...mds, (req, res, next) => {
        repository
          .delete({
            ...req.body,
            meta: req.meta,
          })
          .then((data) => res.json(data))
          .catch((error) => {
            log.error("DELETE", api, "/", "delete", error);
            next(error);
          });
      });
      log.register("DELETE", api, "/", "delete");
    }

    if ((h.deleteOne = has("deleteOne"))) {
      const mds = h.deleteOne.middlewares || [];
      router.delete("/:id", ...mds, (req, res, next) => {
        repository
          .delete({
            query: { id: req.params.id },
            meta: req.meta,
          })
          .then((data) => res.json(data))
          .catch((error) => {
            log.error("DELETE", api, "/:id", "delete", error);
            next(error);
          });
      });
      log.register("DELETE", api, "/:id", "delete");
    }

    if ((h.deleteOne = has("schema"))) {
      const mds = h.deleteOne.middlewares || [];
      router.get("/schema", ...mds, (req, res, next) => {
        res.json(getEntityForm(repository));
      });
      console.log("%s %s", gSpace("GET", 7).cyan, "/schema".green);
    }
  }

  async registerRoute(
    folderPath: string | readonly string[],
    filterOptions?: globby.GlobbyOptions
  ) {
    const modules = await globby(folderPath, filterOptions);
    modules.forEach((filePath) => {
      const api: Api = require(filePath).default;
      if (Array.isArray(api)) {
        api.forEach((e) => this.registerApi(e));
      } else {
        this.registerApi(api);
      }
    });
  }

  registerApi(api: Api) {
    if (!api || !api.path) return;
    api.router = Router();
    if (api.middlewares && api.middlewares.length) {
      api.router.use(...api.middlewares);
    }
    if (api.repository) this.registerCrud(api);
    // Register custom routes
    if (api.routes) {
      Object.keys(api.routes).forEach((key) => {
        let handlers = api.routes[key];
        if (handlers) {
          handlers = Array.isArray(handlers) ? handlers : [handlers];
          if (!handlers.length) return;
          const method: string = key.split(" ").shift().toLocaleLowerCase();
          // prettier-ignore
          if (!["post","get","post","put","patch","delete","connect","options","trace","head"].includes(method)) return;
          const endpoint = key.split(" ").pop();
          if (!endpoint) return;
          // @ts-expect-error
          api.router[method](endpoint, ...handlers);
          // prettier-ignore
          console.log("%s %s%s => %s", gSpace(
            method.toLocaleUpperCase(), 7).cyan, api.path.green, endpoint.green, 
            handlers.map((h) => h.name.cyan).join(" => ")
          );
        }
      });
    }
    this.apis.push(api);
    this.app.use(api.path, api.router);
  }
}
