// src/ui/mypage/EmptyState.jsx
import nubzukiSad from "../../assets/images/nubzuki_sad.png";

export default function EmptyState() {
  return (
    <div className="empty-state">
      <p>오늘 아무것도 발견하지 못했어요</p>
      <img src={nubzukiSad} alt="nubzuki sad" />
    </div>
  );
}

