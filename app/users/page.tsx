import UsersTable from "@/components/users/users-table";
import { getServerSession } from "next-auth";
import { authOptions } from "../api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";

export default async function UsersPage() {
  const session = await getServerSession(authOptions);
  if (!session || session.user?.role !== "superadmin") {
    redirect("/");
  }
  return (
    <main className="p-8">
      <UsersTable />
    </main>
  );
}
