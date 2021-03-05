import express from "express";
import { Express, Router, RequestHandler } from "express";
import { Repository } from "mongoose-orm";
import { ERROR_CODES, RequestError } from "./error";

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
    console.error(
      method,
      (item.path + path).replace(/\/$/, ""),
      "=>",
      item.repository.name + "." + action
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
      method,
      (item.path + path).replace(/\/$/, ""),
      "=>",
      item.repository.name + "." + action,
      error
    );
  },
};

const vError = (rs: any) =>
  new RequestError(422, rs.errors[0]?.message, {
    data: rs.errors,
    code: ERROR_CODES.VALIDATOR_ERROR,
  });

type CrudMethod =
  | "list"
  | "find"
  | "findOne"
  | "create"
  | "bulkCreate"
  | "update"
  | "updateOne"
  | "delete"
  | "deleteOne";

interface CrudConfig {
  path: string;
  repository: Repository;
  methods?: (
    | CrudMethod
    | {
        name: CrudMethod;
        middlewares: RequestHandler[];
      }
  )[];
  middlewares?: RequestHandler[];
}

export class Gateway {
  crud: CrudConfig[];
  app: Express;

  constructor(
    {
      app,
      crud,
    }: {
      app?: Express;
      crud?: CrudConfig[];
    } = {} as any
  ) {
    this.app = app;
    this.crud = crud;
    if (this.crud) {
      this.crud.forEach((item) => {
        // List
        const methods = item.methods || [
          "list",
          "find",
          "findOne",
          "create",
          "bulkCreate",
          "update",
          "updateOne",
          "delete",
          "deleteOne",
        ];
        const router = Router();
        const repository = item.repository;
        if (item.middlewares && item.middlewares.length) {
          router.use(...item.middlewares);
        }

        const crudList: any = methods.find(
          (item) => item === "list" || (item as any).name === "list"
        );
        if (crudList) {
          const mds = crudList.middlewares || [];
          router.get("/", parseQuery, ...mds, (req, res, next) =>
            repository
              .list(req.query)
              .then((data) => res.json(data))
              .catch((error) => {
                log.error("GET", item, "/", "list", error);
                next(error);
              })
          );
          log.register("GET", item, "/", "list");
        }
        const crudFind: any = methods.find(
          (item) => item === "find" || (item as any).name === "find"
        );
        if (crudFind) {
          const mds = crudFind.middlewares || [];
          router.get("/find", parseQuery, ...mds, (req, res, next) =>
            repository
              .find(req.query)
              .then((data) => res.json(data))
              .catch((error) => {
                log.error("GET", item, "/find", "find", error);
                next(error);
              })
          );
          log.register("GET", item, "/find", "find");
        }

        const crudFindOne: any = methods.find(
          (item) => item === "findOne" || (item as any).name === "findOne"
        );
        if (crudFindOne) {
          const mds = crudFindOne.middlewares || [];
          router.get("/find-one", parseQuery, ...mds, (req, res, next) =>
            repository
              .findOne(req.query)
              .then((data) => res.json(data))
              .catch((error) => {
                log.error("GET", item, "/find-one", "findOne", error);
                next(error);
              })
          );
          log.register("GET", item, "/find-one", "findOne");
        }

        const crudCreate: any = methods.find(
          (item) => item === "create" || (item as any).name === "create"
        );
        if (crudCreate) {
          const mds = crudCreate.middlewares || [];
          router.post("/", async (req, res, next) => {
            try {
              const data = req.body.data;
              const validateResult = await repository.validateEntity(data);
              if (!validateResult.valid) {
                return next(vError(validateResult));
              }
              const response = await repository.create(req.body);
              return res.json(response);
            } catch (error) {
              log.error("POST", item, "/", "create", error);
              next(error);
            }
          });
          log.register("POST", item, "/", "createOne");
        }

        const crudBulkCreate: any = methods.find(
          (item) => item === "bulkCreate" || (item as any).name === "bulkCreate"
        );
        if (crudBulkCreate) {
          const mds = crudBulkCreate.middlewares || [];
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
              const response = await repository.createMany(req.body);
              return res.json(response);
            } catch (error) {
              log.error("POST", item, "/bulk-create", "bulkCreate", error);
              next(error);
            }
          });
          log.register("POST", item, "/bulk-create", "create");
        }

        const crudUpdate: any = methods.find(
          (item) => item === "update" || (item as any).name === "update"
        );
        if (crudUpdate) {
          const mds = crudUpdate.middlewares || [];
          router.put("/", ...mds, async (req, res, next) => {
            try {
              const response = await repository.update(req.body);
              return res.json(response);
            } catch (error) {
              log.error("POST", item, "/", "update", error);
              next(error);
            }
          });
          log.register("PUT", item, "/", "update");
        }

        const crudUpdateOne: any = methods.find(
          (item) => item === "updateOne" || (item as any).name === "updateOne"
        );
        if (crudUpdateOne) {
          const mds = crudUpdateOne.middlewares || [];
          router.put("/:id", ...mds, async (req, res, next) => {
            try {
              const data = await repository.updateOne({
                ...req.body,
                query: {
                  id: req.params.id,
                },
              });
              return res.json(data);
            } catch (error) {
              log.error("POST", item, "/bulk-create", "updateOne", error);
              next(error);
            }
          });
          log.register("PUT", item, "/", "updateOne");
        }

        const crudDelete: any = methods.find(
          (item) => item === "delete" || (item as any).name === "delete"
        );
        if (crudDelete) {
          const mds = crudDelete.middlewares || [];
          router.delete("/", ...mds, (req, res, next) => {
            repository
              .delete(req.query)
              .then((data) => res.json(data))
              .catch((error) => {
                log.error("DELETE", item, "/", "delete", error);
                next(error);
              });
          });
          log.register("DELETE", item, "/", "delete");
        }
        const crudDeleteOne: any = methods.find(
          (item) => item === "deleteOne" || (item as any).name === "deleteOne"
        );
        if (crudDeleteOne) {
          const mds = crudDeleteOne.middlewares || [];
          router.delete("/:id", ...mds, (req, res, next) => {
            repository
              .delete({
                query: { id: req.params.id },
              })
              .then((data) => res.json(data))
              .catch((error) => {
                log.error("DELETE", item, "/:id", "delete", error);
                next(error);
              });
          });
          log.register("DELETE", item, "/:id", "delete");
        }
        app.use(item.path, router);
      });
    }
  }
}
