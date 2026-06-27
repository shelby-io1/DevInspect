import { AuthForm } from "@/components/auth/auth-form";

export default function SignupPage() {
  return (
    <div className="flex justify-center">
      <AuthForm
        title="Create your account"
        description="Start with email and password authentication."
        mode="signup"
        submitLabel="Create account"
        footerLabel="Already have an account?"
        footerHref="/login"
        footerCta="Sign in"
      />
    </div>
  );
}
