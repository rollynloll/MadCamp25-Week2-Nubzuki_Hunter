// src/ui/mypage/ProfileCard.jsx
export default function ProfileCard({ profile }) {
  return (
    <div className="profile-card">
      <h1>{profile.nickname} 님</h1>
      <span className="group-pill">{profile.group}</span>
      <p className="muted">현재 {profile.members}명 참여 중</p>
    </div>
  );
}
