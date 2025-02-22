import { auth } from "@/app/(auth)/auth";
import AvatarAdminPage from "./AdminPage";

// app/avatar-admin/page.tsx (Server Component)
export default async function AvatarAdminWrapper() {
  const session = await auth();

  if (!session) {
    // Redirect or show unauthorized message
    return <div>You need to be signed in to view this page.</div>;
  }

  return (
    <AvatarAdminPage
      user={{ id: session.user.id || "", role: session.user.role || "" }}
    />
  );
}
