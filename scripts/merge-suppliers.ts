// scripts/merge-suppliers.ts
import { canonicalSupplierName, normalizeKey } from "@/lib/normalize";
import { prisma } from "@/lib/prisma";

async function main() {
  const all = await prisma.supplier.findMany({
    select: { id: true, name: true, createdAt: true },
    orderBy: { createdAt: "asc" }, // oldest becomes canonical
  });

  // Group by normalized key (case-insensitive)
  const groups = new Map<
    string,
    {
      canonical: { id: string; name: string };
      dupes: { id: string; name: string }[];
    }
  >();

  for (const s of all) {
    const k = normalizeKey(s.name);
    if (!k) continue;

    if (!groups.has(k)) {
      groups.set(k, { canonical: { id: s.id, name: s.name }, dupes: [] });
    } else {
      groups.get(k)!.dupes.push({ id: s.id, name: s.name });
    }
  }

  for (const [k, g] of groups) {
    if (g.dupes.length === 0) continue;

    const canonicalId = g.canonical.id;
    const dupes = g.dupes.map((d) => d.id);

    // optional: enforce canonical name format
    const canonicalName = canonicalSupplierName(g.canonical.name);
    await prisma.supplier.update({
      where: { id: canonicalId },
      data: { name: canonicalName },
    });

    console.log(`\nMerging group "${k}" -> ${canonicalName}`);
    console.log("Canonical:", g.canonical);
    console.log("Dupes:", g.dupes);

    // Pre-fetch canonical supplierProducts productIds to prevent composite PK conflicts
    const canonicalSP = await prisma.supplierProduct.findMany({
      where: { supplierId: canonicalId },
      select: { productId: true },
    });
    const canonicalProductIds = new Set(canonicalSP.map((x) => x.productId));

    await prisma.$transaction(async (tx) => {
      // Move FK references
      await tx.job.updateMany({
        where: { supplierId: { in: dupes } },
        data: { supplierId: canonicalId },
      });

      await tx.orderItem.updateMany({
        where: { supplierId: { in: dupes } },
        data: { supplierId: canonicalId },
      });

      // SupplierProduct: if moving would conflict, delete conflicting rows first
      const dupeSP = await tx.supplierProduct.findMany({
        where: { supplierId: { in: dupes } },
        select: { supplierId: true, productId: true },
      });

      const conflicts = dupeSP.filter((x) =>
        canonicalProductIds.has(x.productId),
      );

      if (conflicts.length) {
        await tx.supplierProduct.deleteMany({
          where: {
            OR: conflicts.map((c) => ({
              supplierId: c.supplierId,
              productId: c.productId,
            })),
          },
        });
      }

      await tx.supplierProduct.updateMany({
        where: { supplierId: { in: dupes } },
        data: { supplierId: canonicalId },
      });

      // Variants reference supplierId directly too
      await tx.productVariant.updateMany({
        where: { supplierId: { in: dupes } },
        data: { supplierId: canonicalId },
      });

      // Delete duplicates
      await tx.supplier.deleteMany({ where: { id: { in: dupes } } });
    });
  }

  console.log("\n✅ Supplier merge complete.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => prisma.$disconnect());
