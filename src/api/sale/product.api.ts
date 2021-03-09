import {
  productAttributeRepository,
  productCategoryRepository,
  productRepository,
  warehouseRepository,
} from "@/entities/warehouse";
import { Api } from "@/helpers/gateway";

export default Api([
  {
    path: "/product-attribute",
    repository: productAttributeRepository,
  },
  {
    path: "/product-category",
    repository: productCategoryRepository,
  },
  {
    path: "/warehouse",
    repository: warehouseRepository,
  },
  {
    path: "/product",
    repository: productRepository,
  },
]);
