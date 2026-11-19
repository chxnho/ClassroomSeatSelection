# 교실 자리 배치 시스템 · ClassroomSeatSelection

정적 교실 자리 배치 도구입니다. GitHub Pages는 `main:/`을 게시하며 화면·배치 로직은 `index.html`에 있습니다. 남녀 짝, 같은 성별 짝, 성별 상관없이 배치와 교실 줄 수, 함께·분리 조건, 앞뒤 모둠 피하기, 지난 짝 피하기를 제공합니다. 탐색은 최대 8,000회이며 미충족 조건을 표시합니다. 완전 탐색이나 최적성 증명을 제공하지 않습니다.

명단·조건 저장과 가져오기·내보내기, 지난 배치 불러오기, 결과 이미지·텍스트 저장을 유지합니다. 저장 키는 `jaripick.slots.v1`, `jaripick.class.prevpairs.v1`이며 기존 파일 형식을 사용합니다. 인쇄 버튼은 브라우저 인쇄를 엽니다.

`baeumgil.css`는 배움길 테마, 390px 화면과 키보드 포커스를 지원합니다. 폰트는 `fonts/`의 Pretendard 3개를 자체 제공하며 라이선스는 `fonts/LICENSE.txt`입니다. 결과 미리보기는 스크롤 영역으로 제한하고, 공개 모션은 최대 1.2초이며 모션 감소 설정에서는 즉시 표시합니다.

## 포털 연동

포털 주소는 `/tools/seats`입니다. GitHub Pages의 기존 origin을 유지해 iframe으로 표시합니다. `?embed=1&parentOrigin=<포털 origin>`은 중복 소개·테마 버튼을 숨기며 작업 컨트롤은 유지합니다. 브라우저의 저장소 분리 정책에 따라 iframe과 직접 연 화면의 저장 명단이 다를 수 있습니다.

`tool-bridge.js`는 운영 포털 `https://chxnho-learning-portal.chxnho.workers.dev`와 localhost/127.0.0.1 QA 부모만 허용합니다. 자식은 `{type:"baeumgil:ready"|"baeumgil:resize",height}`만 보내고, 부모의 `{type:"baeumgil:theme",theme:"light"|"dark"}`만 받습니다. 송수신 origin·source를 검사하며 명단·이름·계정·저장소 값은 전달하지 않습니다. embed 모드에서는 `support.js`의 기존 편집기 메시지를 사용하지 않습니다.

## 합성 기능 검사

```sh
node --test tests/seating.test.mjs
```

실제 HTML의 배치 로직을 가짜 브라우저와 결정적 난수로 실행합니다. 실제 학생 명단·브라우저 저장소·네트워크·DB를 사용하지 않습니다.
