# JECA FAIR 2026 Product Card App

JECA FAIR 2026 출전자 267개사를 대상으로 회사당 대표 제품 1개를 선정해 한국어 심화 제품 카드로 정리하는 웹앱 프로젝트입니다. 현재 버전은 전체 267개 카드 초안이며, A/B 카드는 원문 확인도가 높고 C 카드는 `qa_report.md` 기준으로 후속 검증이 필요합니다.

## Current Scope

- 공식 출전자 일람 기준 출전자 수: 267개사
- 공식 제품콩쿠르 목록 기준 제품: 52개
- 현재 카드 수: 267개 회사, 회사당 대표 제품 1개
- 현재 신뢰도 분포: A 26, B 35, C 206
- 공식 맵 원본: `assets/map/jeca_fair_2026_map.pdf`

## Files

- `AGENTS.md`: 카드 디자인, 문체, 제품 선정, 품질 기준
- `data/exhibitors.csv`: 현재 샘플 5개 회사의 공식 부스/제품 출처
- `data/products/company_XXX.json`: 회사별 대표 제품 카드 데이터
- `data/products/sample_5.json`: 초기 품질 기준 샘플 데이터
- `data/schema.json`: 제품 카드 JSON 스키마
- `data/booth_coords.json`: Hall 강조와 향후 정확 좌표 확장을 위한 지도 데이터
- `assets/images/`: 샘플 제품 이미지
- `assets/map/`: 공식 맵 PDF와 공식 맵 배너 이미지
- `scripts/`: 공식 페이지 수집, 회사 조사, 이미지 다운로드, 품질 검사, 사이트 빌드 스크립트
- `app/`: 샘플 웹앱

## Run Locally

정적 파일 앱이지만 JSON을 불러오기 때문에 프로젝트 루트에서 간단한 서버로 여는 것을 권장합니다.

```powershell
npx http-server . -p 4173
```

Node 실행이 제한된 Windows 환경에서는 포함된 PowerShell 서버를 사용할 수 있습니다.

```powershell
powershell -ExecutionPolicy Bypass -File scripts/serve_static.ps1 -Port 4173
```

그 다음 브라우저에서 `http://127.0.0.1:4173/app/`을 엽니다.

## Quality Checks

Python이 설치된 환경에서는 다음으로 데이터 품질을 검사할 수 있습니다.

```powershell
python scripts/check_quality.py data/products/sample_5.json
```

이 Windows 환경처럼 Python 실행이 제한된 경우에는 PowerShell 검사기를 사용합니다.

```powershell
powershell -ExecutionPolicy Bypass -File scripts/check_quality.ps1
```

검사 결과는 `qa_report.md`에 저장됩니다. 앱 상단의 `품질 검사` 버튼도 중복 이미지 URL, 일반명 제품명, 출처 누락, 짧은 설명, 사양 부족, 임시 부스번호, 자동 보강 C 카드를 빠르게 표시합니다.

## Build

전체 앱 데이터는 다음으로 `app/products.json`에 빌드합니다.

```powershell
powershell -ExecutionPolicy Bypass -File scripts/build_site.ps1
```

GitHub Pages 공유용 정적 사이트는 다음으로 `docs/`에 빌드합니다.

```powershell
powershell -ExecutionPolicy Bypass -File scripts/build_pages.ps1
```

## GitHub Pages 배포

이 저장소를 GitHub에 올린 뒤 repository 설정에서 **Settings → Pages**로 이동합니다.

- Source: `Deploy from a branch`
- Branch: 배포할 브랜치, 보통 `main`
- Folder: `/docs`

저장 후 Pages 빌드가 끝나면 공유 URL은 보통 다음 형식입니다.

```text
https://<github-username>.github.io/<repository-name>/
```

사용자/조직 페이지 저장소처럼 저장소 이름이 `<github-username>.github.io`인 경우에는 다음 형식입니다.

```text
https://<github-username>.github.io/
```

`docs/.nojekyll`을 포함해 GitHub Pages의 Jekyll 처리를 건너뛰도록 했습니다.

## Official Sources Used

- JECA FAIR 2026 출전자一覧: https://www.jecafair.jp/exhibitor/
- JECA FAIR 2026 製品コンクール: https://www.jecafair.jp/event/concours.php
- JECA FAIR 2026 공식 맵 PDF: https://www.jecafair.jp/pdf/map.pdf

다음 단계에서는 `qa_report.md`의 C 카드와 일반명/임시 부스번호 항목을 우선 재조사해 실제 제품명, 제품 이미지, 부스번호, 사양을 보강하면 됩니다.
