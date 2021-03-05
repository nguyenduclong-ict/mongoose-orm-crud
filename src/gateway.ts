import { Express, Router } from "express";
import { RequestError } from "helpers/error";
import { Context, Repository } from "mongoose-orm";

const parseQuery = (req: any) => {
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
};

const logRegisterRoute = (
  method: "GET" | "POST" | "PUT" | "DELETE",
  prefix: string,
  routePath: string,
  repsitoryName: string,
  action: string
) => {
  console.log(
    method,
    (prefix + routePath).replace(/\/$/, ""),
    "=>",
    repsitoryName + "findOne"
  );
};

export class Gateway {
  crud: { path: string; repository: Repository }[];
  app: Express;

  constructor(
    {
      app,
      crud,
    }: {
      app: Express;
      crud?: { path: string; repository: Repository }[];
    } = {} as any
  ) {
    this.app = app;
    this.crud = crud;
    if (this.crud) {
      // List
      this.crud.forEach((item) => {
        const router = Router();
        const repository = item.repository;
        router.get("/", parseQuery, (req, res, next) =>
          repository
            .list(req.query)
            .then((data) => res.json(data))
            .catch(next)
        );
        logRegisterRoute("GET", item.path, "/", repository.name, "list");
        // Find
        router.get("/find", parseQuery, (req, res, next) =>
          repository
            .find(req.query)
            .then((data) => res.json(data))
            .catch(next)
        );
        logRegisterRoute("GET", item.path, "/find", repository.name, "find");
        // FindOne
        router.get("/find-one", parseQuery, (req, res, next) =>
          repository
            .findOne(req.query)
            .then((data) => res.json(data))
            .catch(next)
        );
        logRegisterRoute(
          "GET",
          item.path,
          "/find-one",
          repository.name,
          "findOne"
        );
        // Create
        router.post("/", async (req, res, next) => {
          const validateResult = await repository.validateEntity(req.body);
          if (validateResult.valid) {
            const data = await repository.create(req.body);
            return res.json(data);
          } else {
            return next(
              new RequestError(
                422,
                validateResult.errors[0].message,
                validateResult.errors
              )
            );
          }
        });
        logRegisterRoute("POST", item.path, "/", repository.name, "createOne");
        // BulkCreate
        router.post("/bulk-create", async (req, res, next) => {
          const validateResult = await repository.validateEntity(req.body);
          if (validateResult.valid) {
            const data = await repository.createMany(req.body);
            return res.json(data);
          } else {
            return next(
              new RequestError(
                422,
                validateResult.errors[0].message,
                validateResult.errors
              )
            );
          }
        });
        logRegisterRoute(
          "POST",
          item.path,
          "/bulk-create",
          repository.name,
          "create"
        );
        // Update
        router.put("/", async (req, res, next) => {
          const validateResult = await repository.validateEntity(req.body);
          if (validateResult.valid) {
            const data = await repository.update(req.body);
            return res.json(data);
          } else {
            return next(
              new RequestError(
                422,
                validateResult.errors[0].message,
                validateResult.errors
              )
            );
          }
        });
        logRegisterRoute("PUT", item.path, "/", repository.name, "update");
        // UpdateOne
        router.put("/:id", async (req, res, next) => {
          const validateResult = await repository.validateEntity(req.body);
          if (validateResult.valid) {
            const data = await repository.updateOne({
              ...req.body,
              query: {
                id: req.params.id,
              },
            });
            return res.json(data);
          } else {
            return next(
              new RequestError(
                422,
                validateResult.errors[0].message,
                validateResult.errors
              )
            );
          }
        });
        logRegisterRoute(
          "PUT",
          item.path,
          "/:id",
          repository.name,
          "updateOne"
        );
        // Delete many
        router.delete("/", (req, res, next) => {
          repository
            .delete(req.query)
            .then((data) => res.json(data))
            .catch(next);
        });
        logRegisterRoute("DELETE", item.path, "/", repository.name, "delete");
        // Delete one
        router.delete("/:id", (req, res, next) => {
          repository
            .delete({
              query: { id: req.params.id },
            })
            .then((data) => res.json(data))
            .catch(next);
        });
        logRegisterRoute("DELETE", item.path, "/", repository.name, "delete");
        app.use(item.path, router);
      });
    }
  }
}
