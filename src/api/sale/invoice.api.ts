import { invoiceRepository } from "@/entities/warehouse";
import { Api } from "@/helpers/gateway";

export default Api({
  path: "/invoice",
  repository: invoiceRepository,
});
