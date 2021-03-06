import express from "express";
import { createServer } from "http";
import morgan from "morgan";
import { HandleRequestError } from "./helpers/error";
import { Gateway } from "./helpers/gateway";
import path from "path";

export const app = express();
export const gateway = new Gateway(app);
export const server = createServer(app);

app.use(morgan("dev"));
app.use(express.json());
app.get("/", (req, res) => {
  res.send("sever work!");
});

(async () => {
  await gateway.registerRoute(path.join(__dirname, "api"), {
    expandDirectories: {
      extensions: ["ts", "js"],
      files: ["*.api.ts", "*.api.js"],
    },
  });
  app.use(HandleRequestError);

  const port = Number(process.env.PORT || 5000);
  server.listen(port, () => {
    console.log("Server listen on port ", port);
  });
})();
