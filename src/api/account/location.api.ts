import { locationRepository } from "@/entities/account";
import { Api } from "@/helpers/gateway";

export default Api({
  path: "/location",
  repository: locationRepository,
});
