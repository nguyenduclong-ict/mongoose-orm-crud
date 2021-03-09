import { C, E } from "@/config";
import {
  configRepository,
  roleRepository,
  userRepository,
} from "@/entities/account";
import { User } from "@/entities/account/User";
import { Utils } from "@/helpers";
import { RequestError } from "@/helpers/error";
import { Api } from "@/helpers/gateway";
import { AuthenticationGuard } from "@/middlewares/auth";
import { RequestHandler } from "express";

export const getAccountInfo: RequestHandler = (req, res, next) => {
  return res.json(req.meta.user);
};

const login: RequestHandler = async (req, res, next) => {
  try {
    const { username, password } = req.body;
    const user = await userRepository.findOne({
      query: { username },
    });

    if (!user) return next(new RequestError(401, "User not found"));
    if (user.blocked) return next(new RequestError(401, "User is blocked"));
    if (!Utils.comparePassword(password, user.password))
      return next(new RequestError(401, "Password not match"));
    const token = Utils.createToken({ id: user.id });
    return res.json({ token });
  } catch (error) {
    next(error);
  }
};

const register: RequestHandler = async (req, res, next) => {
  try {
    const method = req.query.method || "username";

    if (method === "username") {
      if (
        await userRepository.findOne({
          query: {
            username: req.body.username,
          },
        })
      ) {
        return next(new RequestError(400, "User not exists!"));
      }

      const CustomerRole = await roleRepository.findOne({
        query: {
          code: C.ROLES.CUSTOMER,
        },
      });

      const data = {
        username: req.body.username,
        password: await Utils.hashPasssword(req.body.password),
        blocked: false,
        roles: [CustomerRole.id],
        profile: {
          name: req.body.profile?.name,
          avatar: req.body.profile?.avatar,
          gender: req.body.profile?.gender || "male",
        },
      } as User;

      const user = await userRepository.create({
        data,
        populates: ["roles"],
      });

      const token = await Utils.createToken({ id: user.id });

      return res.json({
        token,
        user,
      });
    }
  } catch (error) {
    next(error);
  }
};

export const initApplication: RequestHandler = async (req, res, next) => {
  try {
    // init application
    const isInit = await configRepository.findOne({
      query: { key: "inited_app" },
    });

    if (isInit?.value) {
      return next(E.Error(500, "App Already Inited Before"));
    }

    // init roles
    const roles = await roleRepository.createMany({
      data: [
        {
          name: "Admin",
          code: C.ROLES.ADMIN,
        },
        {
          name: "Nhân viên",
          code: C.ROLES.STAFF,
        },
        {
          name: "Khách hàng",
          code: C.ROLES.CUSTOMER,
        },
      ],
    });

    // Create admin user
    const userData = req.body.admin as User;
    const data = {
      username: userData.username,
      password: await Utils.hashPasssword(userData.password),
      blocked: false,
      isAdmin: true,
      profile: {
        name: userData.profile?.name,
        avatar: userData.profile?.avatar,
        gender: userData.profile?.gender || "male",
      },
    } as User;
    const adminUser = await userRepository.create({
      data,
      populates: ["roles"],
    });
    const token = Utils.createToken({ id: adminUser.id });

    // save state inited
    if (isInit) {
      isInit.value = true;
      await configRepository.updateOne({
        query: {
          id: isInit.id,
        },
        data: {
          value: true,
        },
      });
    } else {
      await configRepository.create({
        data: { key: "inited_app", value: true },
      });
    }

    return res.json({
      message: "Inited App success",
      token,
      adminUser,
    });
  } catch (error) {
    next(error);
  }
};

export default Api({
  path: "/auth",
  routes: {
    "GET /me": [AuthenticationGuard, getAccountInfo],
    "POST /login": [login],
    "POST /register": [register],
    "POST /init": [initApplication],
  },
});
