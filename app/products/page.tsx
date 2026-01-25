import { getProducts } from "@/actions/product";
import { getSuppliers } from "@/actions/supplier";

import ProductsTable from "@/components/products/productsTable";
import type { ProductRow } from "@/components/products/productsTable";
import { Supplier } from "@prisma/client";

export default async function ProductsPage() {
  const result = await getProducts();
  const products = result.success
    ? (result.data as unknown as ProductRow[])
    : [];
  const suppliersResult = await getSuppliers();
  const suppliers: Supplier[] =
    suppliersResult &&
    suppliersResult.success &&
    Array.isArray(suppliersResult.data)
      ? suppliersResult.data.map((s) => ({
          ...s,
          createdAt: new Date(), // placeholder, real value not available from SupplierListRow
          updatedAt: new Date(), // placeholder, real value not available from SupplierListRow
        }))
      : [];

  return (
    <div className="max-w-7xl mx-auto w-full max-h-[calc(100vh-60px)] overflow-hidden">
      <ProductsTable products={products} suppliers={suppliers} />
    </div>
  );
}
