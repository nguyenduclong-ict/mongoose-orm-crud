import { AddressRepository } from "./Address";
import { ConfigRepository } from "./Config";
import { LocationRepository } from "./Location";
import { MediaRepository } from "./Media";
import { RoleRepository } from "./Role";
import { UserRepository } from "./User";

export const addressRepository = new AddressRepository();
export const configRepository = new ConfigRepository();
export const roleRepository = new RoleRepository();
export const userRepository = new UserRepository();
export const locationRepository = new LocationRepository();
export const mediaRepository = new MediaRepository();
