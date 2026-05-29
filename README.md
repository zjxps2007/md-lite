# MdLite — Markdown Studio 📝

<p align="center">
  <strong>Tauri + SvelteKit + TypeScript 기반의 초경량 로컬 마크다운 에디터 & 리더</strong>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/License-MIT-blue.svg" alt="License" />
  <img src="https://img.shields.io/badge/SvelteKit-v2-FF3E00.svg" alt="SvelteKit" />
  <img src="https://img.shields.io/badge/Tauri-v2-24C7C0.svg" alt="Tauri" />
  <img src="https://img.shields.io/badge/TypeScript-v5-3178C6.svg" alt="TypeScript" />
</p>

---

## 🌟 주요 특징 (Features)

* **🎨 모던하고 아름다운 UI/UX**: 글래스모피즘(Glassmorphism)과 부드러운 전환 애니메이션을 지원하는 프리미엄 다크/라이트 테마가 탑재되어 있습니다.
* **↔️ 분할 보기 및 실시간 렌더링**: 에디터 영역과 미리보기 영역을 실시간으로 렌더링하며, 필요에 따라 에디터 전용, 미리보기 전용, 분할(Split) 보기를 전환할 수 있습니다.
* **📂 접근성이 강화된 사이드바**:
  - 접기/펴기 상태가 반응형으로 매끄럽게 토글됩니다.
  - 마우스 호버 및 포커스 접근성을 지원하여 키보드/터치 환경에서도 완벽히 제어 가능합니다.
* **📝 고급 마크다운 설정**:
  - 표준 마크다운(CommonMark) 준수 및 실선 줄바꿈(Soft line breaks) 설정 지원
  - HTML 태그 허용 여부, 링크 자동 변환(Linkify), 타이포그래퍼 정밀화 옵션 제공
* **⚡ 스마트 자동완성 및 도구**:
  - CodeMirror 6 기반의 강력한 에디터 인터페이스
  - 제목 헤더, 링크, 코드 블록 등의 마크다운 자동 완성(Autocomplete) 기능 제공
* **🌐 다국어 지원 (i18n)**: 한국어(Korean)와 영어(English) 옵션을 제공하며, 앱 내 모든 설정과 레이블이 실시간으로 동시 번역됩니다.
* **📊 문서 개요 및 통계**: 실시간 단어/글자 수 집계와 함께, 문서 내 헤더를 추출하여 목차(Outline) 형태로 제공해 원하는 위치로 즉시 이동할 수 있습니다.
* **💾 안전한 저장관리**: 파일 수정 상태 표시(Modified/Saved) 및 최근 열었던 파일 목록을 기억하며, 자동 저장(Auto Save) 딜레이 설정을 지원합니다.

---

## 🛠️ 기술 스택 (Tech Stack)

* **Frontend Framework**: SvelteKit (Svelte 5)
* **Language**: TypeScript
* **Desktop Wrapper**: Tauri (v2)
* **Editor Core**: CodeMirror 6 (`@codemirror/view`, `@codemirror/state`, `@codemirror/autocomplete`)
* **Markdown Parser & Tools**: `markdown-it`, `highlight.js`, `dompurify`
* **Build Tool**: Vite

---

## 🚀 로컬 실행 방법 (How to Run)

### 사전 요구 사항
1. **Node.js**: LTS 버전 권장 (v18 이상)
2. **Rust 툴체인**: Tauri 데스크톱 빌드를 위해 [Rustup](https://rustup.rs/)이 설치되어 있어야 합니다.

### 의존성 설치
```bash
npm install
```

### 1. 웹 브라우저에서 프론트엔드만 실행 (빠른 확인)
```bash
npm run dev
```
* 로컬 개발 서버가 구동되며 웹 브라우저(`http://localhost:5173`)를 통해 바로 디자인과 편집 기능을 확인해 볼 수 있습니다.
* *주의: 파일 로컬 저장/열기 등 Tauri의 OS 네이티브 API 호출 기능은 작동하지 않습니다.*

### 2. Tauri 데스크톱 앱으로 실행 (전체 기능)
```bash
npm run tauri dev
```
* 실제 macOS, Windows, Linux 환경의 독자적인 데스크톱 패키지로 실행되며, 시스템 파일 접근 등 모든 기능이 연동됩니다.

### 3. 배포용 데스크톱 앱 빌드
```bash
npm run tauri build
```
* 각 운영체제 규격에 맞는 최적화된 실행 파일(`.app`, `.dmg`, `.exe`, `.deb` 등)이 생성됩니다.

---

## 🧪 테스트 실행 (Testing)

유형 검사 및 단위 테스트를 수행하려면 아래 명령어를 사용합니다.

```bash
# Svelte 타입 검사
npm run check

# Unit 테스트 실행 (Vitest)
npm run test
```

---

## 📄 라이선스 (License)

이 프로젝트는 **MIT 라이선스**를 따르고 있습니다. 상업적 이용, 복제, 수정 및 배포가 완전히 자유로우며, 개인용 및 기업 사내 도구로 제약 없이 투명하게 사용하실 수 있습니다.

```
Copyright (c) 2026 MdLite Contributors
Licensed under the MIT License.
```
