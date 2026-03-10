import { SignUp } from "@clerk/nextjs";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

import { AuthShell } from "@/components/paircode/auth-shell";

export default async function SignUpPage() {
  const { isAuthenticated } = await auth();

  if (isAuthenticated) {
    redirect("/");
  }

  return (
    <AuthShell
      eyebrow="New workspace access"
      title="Create your PairCode account"
      description="Create an authenticated operator account before entering collaborative rooms backed by persistent context and implementation history."
    >
      <SignUp
        path="/sign-up"
        routing="path"
        signInUrl="/sign-in"
        fallbackRedirectUrl="/"
        forceRedirectUrl="/"
      />
    </AuthShell>
  );
}