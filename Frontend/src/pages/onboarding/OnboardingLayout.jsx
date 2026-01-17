import "../../styles/global.css";

export default function OnboardingLayout({ children }) {
  return (
    <div className="app-wrapper">
      <div className="onboarding-container">
        {children}
      </div>
    </div>
  );
}
