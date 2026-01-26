// app/orders/page.tsx (SERVER COMPONENT)
import { getAllJobsDTO } from "@/actions/job";
import { getAllOrders } from "@/actions/order";

import {
  OrdersDataTable,
  type UIOrder,
} from "@/components/orders/orders-data-table";

function decToNumber(v: any) {
  if (v === null || v === undefined) return 0;
  // Prisma Decimal has toString()
  if (typeof v === "object" && typeof v.toString === "function") {
    const n = Number(v.toString());
    return Number.isFinite(n) ? n : 0;
  }
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

export default async function OrdersPage() {
  const ordersRes = await getAllOrders();
  const jobsRes = await getAllJobsDTO();

  const jobs =
    jobsRes.success && jobsRes.data
      ? jobsRes.data.map((j: any) => ({
          id: j.id,
          jobNumber: j.jobNumber,
          siteName: j.siteName,
        }))
      : [];

  const orders: UIOrder[] =
    ordersRes.success && ordersRes.data
      ? ordersRes.data.map((o: any) => {
          const supplier = o.job?.supplier ?? o.items?.[0]?.supplier ?? null;

          return {
            id: o.id,
            orderNumber: o.orderNumber,

            // ✅ send string (plain)
            createdAt:
              o.createdAt instanceof Date
                ? o.createdAt.toISOString()
                : String(o.createdAt),

            status: undefined,

            job: o.job
              ? {
                  id: o.job.id,
                  jobNumber: o.job.jobNumber,
                  siteName: o.job.siteName,
                }
              : null,

            supplier: supplier
              ? { id: supplier.id, name: supplier.name }
              : null,

            // ✅ convert Decimal quantity to number
            items: (o.items ?? []).map((it: any) => ({
              id: it.id,
              quantity: decToNumber(it.quantity),
              unit: it.variant ? `${it.variant.size}${it.variant.unit}` : "—",
            })),

            // OPTIONAL: if your UI ever wants subtotal, pass it as number too
            // subtotal: decToNumber(o.subtotal),
          };
        })
      : [];

  return (
    <div className="max-w-7xl mx-auto w-full">
      <OrdersDataTable orders={orders} jobs={jobs} />
    </div>
  );
}
