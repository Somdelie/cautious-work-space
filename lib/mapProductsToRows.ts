import type { ProductRow } from "@/components/products/productsTable";

export function mapProductsToRows(products: any[]): ProductRow[] {
  return (products ?? []).map((p) => {
    // Build supplierProducts[].variants from supplierVariantPrices
    const supplierProducts = (p.supplierProducts ?? []).map((sp: any) => {
      const variants = (p.supplierVariantPrices ?? [])
        .filter(
          (svp: any) =>
            svp.supplierId === sp.supplierId &&
            svp.productId === sp.productId &&
            svp.isActive !== false
        )
        .map((svp: any) => {
          const opt = svp.productOption?.option;
          const size = opt?.value ?? svp.size ?? 0;
          const unit = opt?.unit?.code ?? svp.unit ?? "";

          return {
            id: svp.id,
            size: Number(size),
            unit: String(unit),
            price: Number(svp.price ?? 0),
            isActive: Boolean(svp.isActive),
          };
        });

      return {
        supplierId: sp.supplierId,
        productId: sp.productId,
        isActive: Boolean(sp.isActive),
        supplier: {
          id: sp.supplier?.id || "",
          name: sp.supplier?.name || "",
          logoUrl: sp.supplier?.logoUrl || null,
        },
        variants,
      };
    });

    const spreadRates = (p.spreadRates ?? []).map((sr: any) => ({
      id: sr.id,
      consumption: Number(sr.consumption ?? 0),
      unit: sr.unit?.code ?? sr.unit ?? "",
      perCoat: Boolean(sr.perCoat),
      notes: sr.notes ?? null,
    }));

    return {
      id: p.id,
      name: p.name,
      shortcut: p.shortcut ?? null,
      usageType: p.usageType,
      discountPrice: p.discountPrice != null ? Number(p.discountPrice) : null,

      createdAt: p.createdAt ? new Date(p.createdAt) : new Date(),
      updatedAt: p.updatedAt ? new Date(p.updatedAt) : new Date(),

      supplierProducts,
      spreadRates,

      // ✅ NEW: store product unit code for the Unit column (reliable)
      // If your ProductRow type doesn’t have this yet, add it there.
      unitCode: p.unit?.code ?? "",
    } as any;
  });
}
