(function () {
  const isFileProtocol = window.location.protocol === 'file:';
  const root = document.documentElement;

  function injectStyles() {
    const style = document.createElement('style');
    style.textContent = `
      .protocol-warning {
        min-height: 100vh;
        display: grid;
        place-items: center;
        padding: 24px;
        color: #f8fafc;
        font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        background: linear-gradient(160deg, #08111f, #10283a);
      }

      .protocol-warning__card {
        width: min(100%, 560px);
        padding: 24px;
        border-radius: 24px;
        background: rgba(9, 16, 29, 0.84);
        border: 1px solid rgba(255, 255, 255, 0.12);
        box-shadow: 0 20px 60px rgba(0, 0, 0, 0.32);
        line-height: 1.6;
      }

      .protocol-warning__title {
        margin: 0 0 12px;
        font-size: 1.4rem;
      }

      .protocol-warning__text {
        margin: 0 0 8px;
        color: rgba(226, 232, 240, 0.82);
      }

      .protocol-warning__code {
        display: block;
        margin-top: 12px;
        padding: 14px 16px;
        border-radius: 16px;
        color: #67e8f9;
        background: rgba(255, 255, 255, 0.08);
        word-break: break-all;
      }
    `;
    document.head.append(style);
  }

  function showProtocolWarning() {
    root.classList.add('protocol-warning-mode');
    document.body.innerHTML = `
      <main class="protocol-warning">
        <section class="protocol-warning__card">
          <h1 class="protocol-warning__title">ブラウザで直接開くことはできません。</h1>
          <p class="protocol-warning__text">ES Modules と manifest は <code>file://</code> では CORS により読み込めません。</p>
          <p class="protocol-warning__text">Windows ではローカルサーバー経由で開いてください。GitHub Pages に公開した本番環境ではそのまま動作します。</p>
          <span class="protocol-warning__code">例: python -m http.server 8000</span>
        </section>
      </main>
    `;
    injectStyles();
  }

  function injectManifest() {
    const manifestLink = document.createElement('link');
    manifestLink.rel = 'manifest';
    manifestLink.href = './manifest.json';
    document.head.append(manifestLink);

    const iconLink = document.createElement('link');
    iconLink.rel = 'icon';
    iconLink.href = './icon.svg';
    iconLink.type = 'image/svg+xml';
    document.head.append(iconLink);

    const appleIconLink = document.createElement('link');
    appleIconLink.rel = 'apple-touch-icon';
    appleIconLink.href = './icon.svg';
    document.head.append(appleIconLink);
  }

  function injectModuleScript() {
    const script = document.createElement('script');
    script.type = 'module';
    script.src = './js/appp.js';
    document.body.append(script);
  }

  if (isFileProtocol) {
    showProtocolWarning();
    return;
  }

  injectManifest();
  injectModuleScript();
})();