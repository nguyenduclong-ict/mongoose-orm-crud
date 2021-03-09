import { userRepository } from "@/entities/account";
import { Utils } from "@/helpers/";
import { RequestError } from "@/helpers/error";
import { RequestHandler } from "express";
import jwt from "jsonwebtoken";

export const AuthenticationGuard: RequestHandler = async (req, res, next) => {
  try {
    const token = Utils.getBearerToken(req.headers.authorization);
    if (!token) return next(new RequestError(401, "Token not found"));
    const tokenData: any = Utils.resolveToken(token);
    const user = await userRepository.fetchUser(tokenData.id);
    if (!user) return next(new RequestError(401, "User not found"));
    req.meta.user = user;
    req.meta.authenticated = true;
    next();
  } catch (error) {
    console.error("AuthenticationGuard", error);
    if (error instanceof jwt.TokenExpiredError) {
      next(new RequestError(401, error.message));
    }
    if (error instanceof jwt.JsonWebTokenError) {
      next(new RequestError(401, error.message));
    }
    next(error);
  }
};

export const FetchUser: RequestHandler = async (req, res, next) => {
  try {
    const token = Utils.getBearerToken(req.headers.authorization);
    if (token) {
      const tokenData: any = Utils.resolveToken(token);
      if (tokenData) {
        const user = await userRepository.fetchUser(tokenData.id);
        if (user) {
          req.meta = req.meta || ({} as any);
          req.meta.user = user;
          req.meta.authenticated = true;
        }
      }
    }
  } catch (error) {
    console.error("FetchUser", error);
  }
  next();
};

interface AuthorizationOptions {
  roles?: string | string[] | ((meta: Express.Request["meta"]) => boolean);
}

export const AuthorizationGuard = (options: AuthorizationOptions) =>
  (async (req, res, next) => {
    if (req.meta.user.isAdmin) return next();
    const { roles } = options;
    let canNext = false,
      message;
    if (roles) {
      if (typeof roles === "string") {
        canNext = !!req.meta?.user.roles.find((role) => role.code === roles);
        message = !canNext && "Required role " + roles;
      }
      if (Array.isArray(roles)) {
        canNext = !!req.meta?.user.roles.some((role) =>
          roles.includes(role.code)
        );
        message = !canNext && "Required role " + roles.join("or ");
      }
      if (typeof roles === "function") {
        canNext = await roles.call(null, req.meta);
        message = !canNext && req.meta.message;
      }
    }
    if (!canNext) return next(new RequestError(403, message));
    next();
  }) as RequestHandler;
