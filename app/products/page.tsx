import { getProducts } from "@/actions/product";
import { getSuppliers } from "@/actions/supplier";
import ProductsTable from "@/components/products/productsTable";

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
    <div className="max-w-7xl mx-auto px-6 py-4">
      {/* <div className="flex items-center justify-between mb-4 border-b border-slate-800 pb-5">
        <div>
          <h1 className="text-2xl font-bold text-slate-100 mb-1">
            Product Catalog
          </h1>
          <p className="text-slate-400 text-sm">
            Manage products and supplier pricing variants
          </p>
        </div>
        <CreateProductTypeDialog />
      </div> */}

      <ProductsTable products={products} suppliers={suppliers} />
    </div>
  );
}
