import { User } from "@/entities/account/User";

declare global {
  namespace Express {
    export interface Request {
      meta?: {
        user?: User & { id?: any; _id?: any };
        authenticated?: boolean;
        [x: string]: any;
      };
    }
  }
}
