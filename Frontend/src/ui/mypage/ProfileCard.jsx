// src/ui/mypage/ProfileCard.jsx
export default function ProfileCard({ profile }) {
  return (
    <div className="profile-card">
      <div className="profile-main">
        <h1>{profile.nickname} 님</h1>
        <div className="profile-meta">
          <span className="profile-group">{profile.group}</span>
          <span className="profile-members">현재 {profile.members}명 참여</span>
        </div>
      </div>
    </div>
  );
}
