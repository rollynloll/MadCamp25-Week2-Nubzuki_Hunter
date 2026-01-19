import "../../styles/auth.css";
import "../../styles/onboarding.css";

export default function OnboardingLayout({ children }) {
  return (
    <div className="login-page onboarding-page">
      <div className="login-card onboarding-card">{children}</div>
    </div>
  );
}
