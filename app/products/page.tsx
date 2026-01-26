import { getProducts } from "@/actions/product";
import { getSuppliers } from "@/actions/supplier";

import ProductsTable from "@/components/products/productsTable";
import { mapProductsToRows } from "@/lib/mapProductsToRows";

export default async function ProductsPage() {
  const result = await getProducts();
  const products = result.success ? mapProductsToRows(result.data as any[]) : [];

  const suppliersResult = await getSuppliers();
  const suppliers =
    suppliersResult?.success && Array.isArray(suppliersResult.data)
      ? suppliersResult.data
      : [];

  return (
   <div className="max-w-7xl mx-auto w-full max-h-[calc(100vh-60px)] overflow-hidden">
      <ProductsTable products={products} suppliers={suppliers} />
    </div>
  );
}
