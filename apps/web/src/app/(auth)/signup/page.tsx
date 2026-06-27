import { AuthForm } from "@/components/auth/auth-form";
import { signUpAction } from "@/app/auth/actions";

export default function SignupPage() {
  return (
    <div className="flex justify-center">
      <AuthForm
        title="Create your account"
        description="Start with email and password authentication for Phase 1."
        action={signUpAction}
        submitLabel="Create account"
        footerLabel="Already have an account?"
        footerHref="/login"
        footerCta="Sign in"
      />
    </div>
  );
}
