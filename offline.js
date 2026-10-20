(() => {
  const panel = document.createElement('aside');
  panel.style.cssText = 'position:relative;z-index:1000;padding:12px;margin:12px;border:1px solid #cbd5e1;border-radius:12px;background:#fff;color:#172033;font:14px/1.6 -apple-system,sans-serif;clear:both';
  const status = document.createElement('div');
  status.setAttribute('role', 'status');
  const note = document.createElement('div');
  note.textContent = '일정·장소 목록·경비는 오프라인 저장 대상입니다. 지도 배경·구글맵 길찾기는 인터넷이 필요합니다. Google Maps 앱에서 하노이·사파 지도를 별도 다운로드하세요. 경비는 이 기기에만 저장됩니다.';
  const nav = document.createElement('nav');
  for (const [label, path] of [['지도·장소', 'index.html'], ['맛집', 'hanoi-food.html'], ['일정', 'trip-itinerary.html'], ['경비', 'trip-expenses.html']]) {
    const link = document.createElement('a');
    link.href = './' + path; link.textContent = label;
    link.style.cssText = 'display:inline-block;margin-right:16px;padding:6px 0;color:#0058b0';
    nav.append(link);
  }
  panel.append(status, note, nav);
  document.body.prepend(panel);
  let ready = false;
  function update() {
    status.textContent = ready
      ? (navigator.onLine ? '✓ 오프라인 준비 완료 · 출발 전 비행기 모드로 확인하세요.' : '✓ 오프라인 모드 · 저장된 여행 자료를 사용 중입니다.')
      : '오프라인 저장 준비 중… 인터넷 연결을 유지하세요.';
  }
  update();
  window.addEventListener('online', update);
  window.addEventListener('offline', update);
  if (!('serviceWorker' in navigator)) {
    status.textContent = '이 브라우저에서는 오프라인 저장을 지원하지 않습니다. 일정을 별도 저장하세요.';
    return;
  }
  navigator.serviceWorker.register('./sw.js').then(async registration => {
    await navigator.serviceWorker.ready;
    ready = true; update();
    const showUpdate = () => {
      if (!registration.waiting || panel.querySelector('button')) return;
      const button = document.createElement('button');
      button.textContent = '새 여행 자료 적용';
      button.onclick = async () => {
        if (!confirm('입력 중인 내용을 저장했나요? 열려 있는 여행 도구를 모두 닫고 다시 열면 업데이트됩니다.')) return;
        status.textContent = '홈 화면 도구와 여행 페이지를 모두 닫은 뒤 다시 열어주세요.';
      };
      panel.append(button);
    };
    showUpdate();
    registration.addEventListener('updatefound', () => {
      const worker = registration.installing;
      worker?.addEventListener('statechange', showUpdate);
    });
  }).catch(() => {
    status.textContent = '오프라인 저장 실패 · 인터넷 연결과 저장 공간을 확인하고 다시 여세요.';
  });
})();
