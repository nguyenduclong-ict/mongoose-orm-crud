import { InvoiceRepository } from "./Invoice";
import { ProductRepository } from "./Product";
import { ProductAttributeRepository } from "./ProductAttribute";
import { ProductCategoryRepository } from "./ProductCategory";
import { InventoryRepository } from "./Inventory";
import { WarehouseRepository } from "./Warehouse";

export const productRepository = new ProductRepository();
export const productAttributeRepository = new ProductAttributeRepository();
export const invoiceRepository = new InvoiceRepository();
export const warehouseRepository = new WarehouseRepository();
export const inventoryRepository = new InventoryRepository();
export const productCategoryRepository = new ProductCategoryRepository();
