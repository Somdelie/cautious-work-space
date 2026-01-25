// app/(dashboard)/suppliers/page.tsx
import { getSuppliers } from "@/actions/supplier";
import SuppliersClient from "@/components/suppliers/Suppliers";

export default async function SuppliersPage() {
  const result = await getSuppliers();

  const suppliers = result.success && result.data ? result.data : [];

  return <SuppliersClient initialSuppliers={suppliers} />;
}
