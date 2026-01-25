import { getProducts } from "@/actions/product";
import { getSuppliers } from "@/actions/supplier";

import ProductsTable from "@/components/products/productsTable";
import { SyncJobsButton } from "@/components/common/SyncJobsButton";

import type { ProductRow } from "@/components/products/productsTable";
import { Supplier } from "@prisma/client";

export default async function ProductsPage() {
  const result = await getProducts();
  const products = (result.success ? result.data : []) as ProductRow[];
  const suppliersResult = await getSuppliers();
  const suppliers: Supplier[] = Array.isArray(suppliersResult.data)
    ? suppliersResult.data
    : [];

  return (
    <div className="max-w-7xl mx-auto w-full max-h-[calc(100vh-60px)] overflow-hidden">
      <ProductsTable products={products} suppliers={suppliers} />
    </div>
  );
}
