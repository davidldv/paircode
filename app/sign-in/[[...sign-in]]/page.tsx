import { SignIn } from "@clerk/nextjs";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

import { AuthShell } from "@/components/paircode/auth-shell";

export default async function SignInPage() {
  const { isAuthenticated } = await auth();

  if (isAuthenticated) {
    redirect("/");
  }

  return (
    <AuthShell
      title="Sign in to the engineering workspace"
      description="Access collaborative rooms with a verified operator identity, persistent threaded context, and room-level implementation history."
    >
      <SignIn
        path="/sign-in"
        routing="path"
        signUpUrl="/sign-up"
        fallbackRedirectUrl="/"
        forceRedirectUrl="/"
      />
    </AuthShell>
  );
}