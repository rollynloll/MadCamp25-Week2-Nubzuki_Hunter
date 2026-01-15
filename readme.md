# Nupzuki Hunter (넙죽이 헌터)
**카이스트 눈알 찾기 – 총장님을 도와라!**

KAIST 캠퍼스 곳곳에 숨겨진 ‘눈알(넙죽이)’을 찾아 **QR을 스캔**하고,  
**분반(그룹) 단위로 3일간 점수를 경쟁**하는 오프라인-온라인 연동 웹게임 프로젝트.

배포 주소:
- 프론트엔드: https://game.seungwoon.com
- 백엔드 API: https://api.seungwoon.com

---

## 평가 기준 대응 전략
- **문제제시**: 캠퍼스 행사에서 참여 동기·팀 경쟁·즉각적 보상을 결합한 게임형 경험
- **기술적 참신함**: QR + 지도 + (보너스) AR/업적 시스템
- **다 같이 사용**: 웹 기반, 모바일 친화, 그룹 리더보드
- **기능 압축(핵심 2개)**  
  1. QR 스캔 → 눈알 획득 및 점수 반영  
  2. 지도 + 리더보드로 실시간 경쟁 상황 공유

---

## 게임 컨셉 & 룰
- 캠퍼스 건물별로 눈알이 숨겨져 있음 (눈알 뒷면에 QR)
- QR 스캔 시 획득 처리 및 점수 지급
- 분반(그룹) 단위로 3일간 경쟁
- 가장 많은 눈알을 찾은 분반이 우승
- (옵션) 금주 픽, 벌칙, 오프라인 이벤트 연계 가능

---

## 사용자 경험(UX) 흐름

### 1. 온보딩
- 로그인 / 회원가입 (아이디 + 비밀번호, 최대한 가볍게)
- 그룹(분반) 선택 (미리 생성된 그룹 중 선택)

### 2. 지도
- KAIST 지도에서 건물별 눈알 분포 표시
- 현재 1등 분반 및 순위
- 내 위치 표시
- 게임 설명/룰 안내

### 3. 성적
- 개인별 성적
- 그룹별 성적(리더보드)
- 내 성적 요약

### 4. 획득 이벤트
- 건물별로 다른 획득 연출
- (보너스) AR 이벤트
- 업적 시스템 (첫 발견, 특정 건물 올클 등)

### 5. 게임 오버
- 최종 우승 분반 발표
- 다양한 어워드 수여

---

## 기술 스택

### Frontend
- React + Vite
- TypeScript
- TailwindCSS
- QR 스캔: `html5-qrcode`
- 지도: 네이버 지도 API

### Backend
- FastAPI
- PostgreSQL
- SQLAlchemy / SQLModel
- JWT 기반 인증

### Infra
- Frontend: Cloudflare Pages
- Backend: Fly.io
- DB: Supabase(Postgres)
- Domain/DNS: Cloudflare  
  - `game.seungwoon.com` (프론트)
  - `api.seungwoon.com` (백엔드)

---

## 로컬 개발 환경 설치 (Mac 기준)

> 프론트엔드 + 백엔드 개발 및 배포를 위한 최소 환경

### 공통 필수
- [ ] **Git**
  - 확인: `git --version`

- [ ] **Node.js (LTS 권장)** + npm
  - 프론트엔드 개발용
  - 권장: `nvm`으로 설치
  - 확인: `node -v`, `npm -v`

### 프론트엔드 (Vite + React)
- [ ] Node.js 설치되어 있으면 충분
- [ ] (권장) 패키지 매니저 통일
  - `pnpm` 또는 `yarn`
  - pnpm 설치: `npm i -g pnpm`
  - 확인: `pnpm -v`

### 백엔드 (FastAPI)
- [ ] **Python 3.11 이상**
  - 확인: `python3 --version`

- [ ] Python 패키지 매니저
  - `uv` (권장) 또는 `pip + venv`

- [ ] **Docker Desktop** (권장)
  - 로컬/배포 환경 통일
  - 확인: `docker --version`

### 배포 도구
- [ ] **Fly.io CLI (`flyctl`)**
  - 백엔드 배포용
  - 확인: `fly version`

---

## 일정 / 체크포인트

### 목표
- **일요일까지**: 지도 화면 + 기본 API 연동 완료
- **화요일까지**: QR 스캔 → 획득 → 점수 반영까지 실제 테스트 가능

### 권장 일정
- Thu–Fri: 인증 / 그룹 선택 / DB 스키마
- Sat: 지도 UI + 눈알 스팟 연동 + 리더보드
- Sun: QR 스캔 & claim 전체 플로우 완성
- Mon: 운영 안정화(중복 스캔 방지, 로그)
- Tue: 실물 눈알 테스트 & 발표 준비

---

## 운영/구현 주의사항
- QR 중복 스캔 방지 필수 (서버 검증)
- 모바일 Safari 카메라 권한 → HTTPS 필수
- claim 실패 시 재시도 UX 필요
- 운영자용 스팟 on/off 기능 최소한으로라도 준비 권장
