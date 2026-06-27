import { AuthForm } from "@/components/auth/auth-form";
import { signInAction } from "@/app/auth/actions";

export default function LoginPage() {
  return (
    <div className="flex justify-center">
      <AuthForm
        title="Welcome back"
        description="Sign in to continue to your DevInspect dashboard."
        action={signInAction}
        submitLabel="Sign in"
        footerLabel="New to DevInspect?"
        footerHref="/signup"
        footerCta="Create an account"
      />
    </div>
  );
}
