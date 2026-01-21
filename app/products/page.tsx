import { getProductTypes } from "@/actions/product-type";
import { CreateProductTypeDialog } from "@/components/dialogs/create-product";
import ProductTypesTable from "@/components/products/productTypesTable";

async function ProductTypesPage() {
  const productTypes = await getProductTypes();
  const productTypesData = productTypes.data || [];

  return (
    <div className="">
      <div className="max-w-7xl mx-auto px-6 py-2">
        <div className="flex items-center justify-between mb-2 border-b border-slate-800 pb-5">
          <div>
            <h1 className="text-2xl font-bold text-slate-100 mb-1">
              Product Types
            </h1>
            <p className="text-slate-400 text-sm">
              Track and manage all your product types in one place
            </p>
          </div>
          <CreateProductTypeDialog />
        </div>
        <ProductTypesTable productTypes={productTypesData} />
      </div>
    </div>
  );
}

export default ProductTypesPage;

//   return (
//     <div className="max-h-[90vh] overflow-y-auto px-4 py-4 w-full overflow-x-hidden">
//       {/* <div className="flex items-center justify-between mb-4 border-b border-slate-800 pb-5">
//         <h1 className="text-3xl font-bold text-white tracking-tight">
//           Product Types
//         </h1>
//         <CreateProductTypeDialog />
//       </div> */}
//       <ProductTypesTable productTypes={productTypesData} />
//     </div>
//   );
// }
