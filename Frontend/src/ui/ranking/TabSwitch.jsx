// src/ui/ranking/TabSwitch.jsx
export default function TabSwitch({ active, onChange }) {
  return (
    <div className="ranking-tabs">
      <button
        className={active === "individual" ? "tab active" : "tab"}
        onClick={() => onChange("individual")}
      >
        개인
      </button>
      <button
        className={active === "group" ? "tab active" : "tab"}
        onClick={() => onChange("group")}
      >
        분반
      </button>
    </div>
  );
}
