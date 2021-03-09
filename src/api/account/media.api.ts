import { mediaRepository } from "@/entities/account";
import { MediaSource } from "@/entities/account/Media";
import { Api } from "@/helpers/gateway";
import { FetchUser } from "@/middlewares/auth";
import { RequestHandler } from "express";
import multer from "multer";
import path from "path";
import { Types } from "mongoose";

export const UPLOAD_PATH = path.resolve(
  process.cwd(),
  process.env.STATIC_PATH,
  "upload"
);
const upload = multer({
  storage: multer.diskStorage({
    destination: UPLOAD_PATH,
    filename: (req, file, callback) => {
      callback(null, Types.ObjectId().toHexString() + "-" + file.originalname);
    },
  }),
});

export const uploadSingleFile: RequestHandler = async (req, res, next) => {
  try {
    const media = await mediaRepository.create({
      data: {
        name: req.file.filename,
        path: req.file.path.replace(UPLOAD_PATH, ""),
        meta: req.body.meta,
        type: MediaSource.LOCAL,
      },
      meta: req.meta,
      populates: ["createdBy", "updatedBy"],
    });
    res.json(media);
  } catch (error) {
    next(error);
  }
};

export default Api({
  path: "/media",
  repository: mediaRepository,
  routes: {
    "POST /upload": [FetchUser, upload.single("file"), uploadSingleFile],
  },
});
