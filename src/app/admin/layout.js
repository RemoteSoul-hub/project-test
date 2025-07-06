import { auth } from "../auth";
import { redirect } from "next/navigation";
import AdminLayoutClient from "./AdminLayoutClient";

export const metadata = {
  title: 'Admin Dashboard - ThinkHuge',
  description: 'Admin dashboard for ThinkHuge platform',
};

// Export the combined layout
export default async function AdminLayout({ children }) {
  // Get the session server-side
  const session = await auth();
  
  // Check if user is authenticated and is an admin
  if (!session || !session.isAdmin) {
    redirect("/login");
  }
  
  return <AdminLayoutClient session={session}>{children}</AdminLayoutClient>;
}
