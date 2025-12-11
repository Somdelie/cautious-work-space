import { getProductTypes } from "@/actions/product-type";
import { ProductTypesTable } from "@/components/products/productTypesTable";

async function ProductTypesPage() {
  const productTypes = await getProductTypes();
  const productTypesData = productTypes.data || [];
  return (
    <div className="max-h-[90vh] overflow-y-auto px-4 py-4 w-full">
      {/* <div className="flex items-center justify-between mb-4 border-b border-slate-800 pb-5">
        <h1 className="text-3xl font-bold text-white tracking-tight">
          Product Types
        </h1>
        <CreateProductTypeDialog />
      </div> */}
      <ProductTypesTable productTypes={productTypesData} />
    </div>
  );
}

export default ProductTypesPage;
