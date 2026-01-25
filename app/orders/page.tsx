// app/orders/page.tsx (SERVER COMPONENT)
import { getAllOrders } from "@/actions/order";
import { getAllJobs } from "@/actions/job";
import {
  OrdersDataTable,
  type UIOrder,
} from "@/components/orders/orders-data-table";

export default async function OrdersPage() {
  const ordersRes = await getAllOrders();
  const jobsRes = await getAllJobs();

  // ✅ jobs must NEVER be undefined
  const jobs =
    jobsRes.success && jobsRes.data
      ? jobsRes.data.map((j) => ({
          id: j.id,
          jobNumber: j.jobNumber,
          siteName: j.siteName,
        }))
      : [];

  // ✅ Map Prisma -> UIOrder (supplier required)
  const orders: UIOrder[] =
    ordersRes.success && ordersRes.data
      ? ordersRes.data.map((o) => {
          // pick supplier from job.supplier first, fallback to first item.supplier
          const supplier = o.job?.supplier ?? o.items?.[0]?.supplier ?? null;

          return {
            id: o.id,
            orderNumber: o.orderNumber,
            createdAt: o.createdAt,
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

            items: o.items.map((it) => ({
              id: it.id,
              quantity: it.quantity,
              unit: it.variant ? `${it.variant.size}${it.variant.unit}` : "—",
            })),
          };
        })
      : [];

  return (
    <div className="max-w-7xl mx-auto w-full">
      <OrdersDataTable orders={orders} jobs={jobs} />
    </div>
  );
}
