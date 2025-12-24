import Head from 'next/head'

export default function AdminLayout({ title, subtitle, actions, children }) {
  return (
    <div className="admin-shell">
      <Head>
        <title>{title}</title>
        <meta name="robots" content="noindex" />
      </Head>
      <div className="admin-content">
        <header className="admin-header">
          <div>
            <p className="admin-eyebrow">Admin</p>
            <h1 className="admin-title">{title}</h1>
            {subtitle && <p className="admin-subtitle">{subtitle}</p>}
          </div>
          {actions && <div className="admin-actions">{actions}</div>}
        </header>
        <main className="admin-main">{children}</main>
      </div>
      <style jsx global>{`
        :root {
          color-scheme: light;
        }
        .admin-shell {
          min-height: 100vh;
          background: #f6f4f1;
          color: #1d1b19;
          padding: 6rem clamp(1.5rem, 3vw, 3rem) 4rem;
          font-family: "SF Pro Text", "Helvetica Neue", Arial, sans-serif;
        }
        .admin-content {
          max-width: 1400px;
          margin: 0 auto;
          width: 100%;
        }
        .admin-header {
          display: flex;
          flex-wrap: wrap;
          align-items: flex-end;
          justify-content: space-between;
          gap: 1.5rem;
          margin-bottom: 2.5rem;
        }
        .admin-eyebrow {
          font-size: 0.7rem;
          text-transform: uppercase;
          letter-spacing: 0.2em;
          color: #6b6259;
          margin-bottom: 0.5rem;
        }
        .admin-title {
          font-size: clamp(1.75rem, 3vw, 2.5rem);
          font-weight: 500;
          margin: 0;
        }
        .admin-subtitle {
          margin-top: 0.5rem;
          color: #5c544c;
          max-width: 52rem;
        }
        .admin-actions {
          display: flex;
          gap: 0.75rem;
          flex-wrap: wrap;
        }
        .admin-main {
          display: block;
        }
        .admin-split {
          display: grid;
          grid-template-columns: minmax(320px, 430px) minmax(0, 1fr);
          gap: 2rem;
          align-items: start;
        }
        .admin-sidebar {
          position: sticky;
          top: 7rem;
          align-self: start;
          height: calc(100vh - 8rem);
          overflow: hidden;
        }
        .admin-sidebar .admin-card {
          height: 100%;
          overflow-y: auto;
          overflow-x: hidden;
          padding-right: 0.75rem;
        }
        .admin-panel {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
          min-width: 0;
          max-width: 980px;
          width: 100%;
        }
        .admin-panel-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 1.5rem;
        }
        .admin-panel-title {
          font-size: 1.4rem;
          margin: 0;
          font-weight: 500;
        }
        .admin-panel-subtitle {
          margin-top: 0.4rem;
          color: #6b6259;
        }
        .admin-panel-empty {
          text-align: center;
          padding: 3rem 2rem;
        }
        .admin-button {
          border: 1px solid #1d1b19;
          background: #1d1b19;
          color: #f6f4f1;
          padding: 0.65rem 1.2rem;
          border-radius: 999px;
          font-size: 0.85rem;
          letter-spacing: 0.04em;
          text-transform: uppercase;
          cursor: pointer;
          transition: transform 0.2s ease, box-shadow 0.2s ease;
        }
        .admin-button.secondary {
          background: transparent;
          color: #1d1b19;
        }
        .admin-button.danger {
          background: #b42318;
          border-color: #b42318;
          color: #fff;
        }
        .admin-button.primary {
          background: #1f5b3b;
          border-color: #1f5b3b;
          color: #fff;
        }
        .admin-button.warning {
          background: #b2810a;
          border-color: #b2810a;
          color: #fff;
        }
        .admin-button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
        .admin-card {
          background: #fff;
          border-radius: 16px;
          box-shadow: 0 24px 60px rgba(18, 14, 10, 0.08);
          padding: 2rem;
          border: 1px solid rgba(29, 27, 25, 0.08);
        }
        .admin-grid {
          display: grid;
          gap: 1.5rem;
        }
        .admin-field {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }
        .admin-label {
          font-size: 0.75rem;
          text-transform: uppercase;
          letter-spacing: 0.18em;
          color: #6b6259;
        }
        .admin-input,
        .admin-textarea,
        .admin-select {
          border: 1px solid rgba(29, 27, 25, 0.2);
          border-radius: 12px;
          padding: 0.75rem 0.9rem;
          font-size: 1rem;
          background: #fff;
          transition: border-color 0.2s ease, box-shadow 0.2s ease;
        }
        .admin-input:focus,
        .admin-textarea:focus,
        .admin-select:focus {
          outline: none;
          border-color: #1d1b19;
          box-shadow: 0 0 0 2px rgba(29, 27, 25, 0.1);
        }
        .admin-textarea {
          min-height: 180px;
          resize: vertical;
        }
        .admin-note {
          font-size: 0.85rem;
          color: #6b6259;
        }
        .admin-divider {
          height: 1px;
          background: rgba(29, 27, 25, 0.1);
          margin: 2rem 0;
        }
        .admin-pill {
          display: inline-flex;
          align-items: center;
          gap: 0.4rem;
          padding: 0.3rem 0.8rem;
          border-radius: 999px;
          background: rgba(29, 27, 25, 0.08);
          font-size: 0.75rem;
          text-transform: uppercase;
          letter-spacing: 0.12em;
        }
        .admin-list {
          display: grid;
          gap: 0.75rem;
        }
        .admin-row {
          display: grid;
          grid-template-columns: 72px 1fr;
          gap: 0.85rem;
          align-items: center;
          padding: 0.75rem 0.85rem;
          border-radius: 14px;
          border: 1px solid rgba(29, 27, 25, 0.1);
          background: #fff;
          text-decoration: none;
          color: inherit;
          transition: transform 0.2s ease, box-shadow 0.2s ease;
          cursor: pointer;
        }
        .admin-row-media {
          width: 72px;
          height: 56px;
          border-radius: 12px;
          overflow: hidden;
          background: #ece7e0;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .admin-row-media img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        .admin-row-placeholder {
          font-size: 0.6rem;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          color: #8d8278;
        }
        .admin-row-content {
          display: flex;
          flex-direction: column;
          gap: 0.35rem;
          min-width: 0;
        }
        .admin-row:hover {
          transform: translateY(-2px);
          box-shadow: 0 10px 20px rgba(29, 27, 25, 0.08);
        }
        .admin-row.is-active {
          border-color: rgba(29, 27, 25, 0.45);
          box-shadow: 0 12px 24px rgba(29, 27, 25, 0.12);
        }
        .admin-row-title {
          font-size: 0.98rem;
          font-weight: 500;
          line-height: 1.2;
          overflow: hidden;
          text-overflow: ellipsis;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
        }
        .admin-row-meta {
          font-size: 0.75rem;
          color: #6b6259;
          display: flex;
          flex-wrap: wrap;
          gap: 0.4rem;
        }
        .admin-badge {
          padding: 0.2rem 0.5rem;
          border-radius: 999px;
          background: rgba(29, 27, 25, 0.08);
          font-size: 0.6rem;
          letter-spacing: 0.12em;
          text-transform: uppercase;
        }
        .admin-badge.warning {
          background: rgba(244, 200, 75, 0.25);
          color: #6b4f00;
        }
        .admin-image-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
          gap: 1rem;
        }
        .admin-media-grid {
          align-items: start;
        }
        .admin-image-card {
          border: 1px solid rgba(29, 27, 25, 0.12);
          border-radius: 12px;
          overflow: hidden;
          background: #f6f4f1;
        }
        .admin-image-card img {
          display: block;
          width: 100%;
          height: 140px;
          object-fit: cover;
        }
        .admin-image-card.full {
          padding: 0.4rem;
        }
        .admin-image-card.full img {
          height: auto;
          max-height: 220px;
          object-fit: contain;
        }
        .admin-image-card.hero img {
          height: 220px;
          object-fit: contain;
          background: #f6f4f1;
        }
        .admin-image-actions {
          padding: 0.5rem;
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 0.75rem;
        }
        .admin-inline-actions {
          display: flex;
          gap: 0.5rem;
          flex-wrap: wrap;
        }
        .admin-editor-shell {
          display: grid;
          gap: 0.5rem;
        }
        .admin-toolbar {
          display: flex;
          gap: 0.5rem;
          flex-wrap: wrap;
          padding: 0.5rem;
          border-radius: 12px 12px 0 0;
          border: 1px solid rgba(29, 27, 25, 0.2);
          background: #f9f6f2;
        }
        .admin-toolbar button {
          border: 1px solid rgba(29, 27, 25, 0.2);
          background: #fff;
          border-radius: 8px;
          padding: 0.35rem 0.6rem;
          font-size: 0.85rem;
          cursor: pointer;
        }
        .admin-editor {
          border: 1px solid rgba(29, 27, 25, 0.2);
          border-top: none;
          border-radius: 0 0 12px 12px;
          padding: 0.85rem;
          min-height: 220px;
          background: #fff;
        }
        .admin-editor:focus {
          outline: none;
          border-color: #1d1b19;
          box-shadow: 0 0 0 2px rgba(29, 27, 25, 0.1);
        }
        .admin-editor:empty:before {
          content: attr(data-placeholder);
          color: #9a9188;
        }
        .admin-editor a {
          color: #1d1b19;
          text-decoration: underline;
        }
        .admin-link {
          color: inherit;
          text-decoration: none;
        }
        @media (max-width: 640px) {
          .admin-shell {
            padding: 5rem 1.25rem 3rem;
          }
          .admin-card {
            padding: 1.5rem;
          }
          .admin-panel-header {
            flex-direction: column;
            align-items: flex-start;
          }
          .admin-row {
            grid-template-columns: 1fr;
          }
          .admin-row-media {
            width: 100%;
            height: 120px;
          }
        }
        @media (max-width: 960px) {
          .admin-split {
            grid-template-columns: 1fr;
          }
          .admin-sidebar {
            position: static;
            height: auto;
          }
          .admin-sidebar .admin-card {
            max-height: 60vh;
          }
        }
      `}</style>
    </div>
  )
}
