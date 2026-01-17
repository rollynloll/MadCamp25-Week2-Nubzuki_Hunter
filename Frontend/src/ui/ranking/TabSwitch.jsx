// src/ui/ranking/TabSwitch.jsx
export default function TabSwitch({ value, onChange }) {
  return (
    <div className="ranking-tabs">
      <button
        className={`tab ${value === "individual" ? "active" : ""}`}
        onClick={() => onChange?.("individual")}
        type="button"
      >
        개인
      </button>

      <button
        className={`tab ${value === "group" ? "active" : ""}`}
        onClick={() => onChange?.("group")}
        type="button"
      >
        분반
      </button>
    </div>
  );
}
