import { getPreferenceContext, updatePreferencesByToken } from "@/services/newsletter";

const NEWSLETTER_LABELS: Record<string, string> = {
  news: "News digest",
  jobs: "Jobs updates",
  candidates: "Candidate updates",
};

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function renderPreferencePage(token: string, data: {
  email: string;
  preferences: Array<{ type: string; enabled: boolean }>;
}) {
  const checkboxes = data.preferences.map((preference) => `
    <label class="option">
      <input
        type="checkbox"
        name="newsletterType"
        value="${escapeHtml(preference.type)}"
        ${preference.enabled ? "checked" : ""}
      />
      <span>${escapeHtml(NEWSLETTER_LABELS[preference.type] || preference.type)}</span>
    </label>
  `).join("");

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Newsletter preferences</title>
  <style>
    * { box-sizing: border-box; }
    body {
      margin: 0;
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 24px;
      background: #fafafa;
      color: #171717;
      font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
    }
    .card {
      width: 100%;
      max-width: 560px;
      background: #fff;
      border: 1px solid #e5e5e5;
      border-radius: 20px;
      padding: 32px;
      box-shadow: 0 12px 48px rgba(23, 23, 23, 0.06);
    }
    h1 {
      margin: 0 0 12px;
      font-size: 28px;
      line-height: 1.1;
    }
    p {
      margin: 0 0 16px;
      color: #525252;
      line-height: 1.6;
    }
    .email {
      display: inline-flex;
      align-items: center;
      border-radius: 999px;
      background: #f5f5f5;
      padding: 8px 12px;
      margin-bottom: 20px;
      font-size: 14px;
      color: #404040;
    }
    form {
      display: grid;
      gap: 12px;
    }
    .option {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 14px 16px;
      border: 1px solid #e5e5e5;
      border-radius: 14px;
      background: #fafafa;
      font-size: 15px;
    }
    .actions {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-top: 8px;
      flex-wrap: wrap;
    }
    button {
      border: 0;
      border-radius: 999px;
      background: #171717;
      color: #fff;
      padding: 12px 18px;
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;
    }
    button:disabled {
      opacity: 0.6;
      cursor: default;
    }
    .status {
      min-height: 20px;
      font-size: 14px;
      color: #525252;
    }
    .status.error {
      color: #b91c1c;
    }
    .status.success {
      color: #15803d;
    }
  </style>
</head>
<body>
  <main class="card">
    <h1>Manage your newsletter preferences</h1>
    <p>Choose which updates you want to keep receiving.</p>
    <div class="email">${escapeHtml(data.email)}</div>
    <form id="preferences-form">
      ${checkboxes}
      <div class="actions">
        <button id="submit-button" type="submit">Save preferences</button>
        <div id="status" class="status" aria-live="polite"></div>
      </div>
    </form>
  </main>
  <script>
    const token = ${JSON.stringify(token)};
    const form = document.getElementById("preferences-form");
    const status = document.getElementById("status");
    const submitButton = document.getElementById("submit-button");

    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      submitButton.disabled = true;
      status.className = "status";
      status.textContent = "Saving...";

      const newsletterTypes = Array.from(form.querySelectorAll('input[name="newsletterType"]:checked'))
        .map((input) => input.value);

      try {
        const response = await fetch(window.location.pathname, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token, newsletterTypes }),
        });
        const payload = await response.json();

        if (!response.ok) {
          status.className = "status error";
          status.textContent = payload.error || "Unable to save preferences.";
          return;
        }

        status.className = "status success";
        status.textContent = newsletterTypes.length > 0
          ? "Preferences saved."
          : "You have been unsubscribed from all newsletter updates.";
      } catch {
        status.className = "status error";
        status.textContent = "Unable to save preferences right now.";
      } finally {
        submitButton.disabled = false;
      }
    });
  </script>
</body>
</html>`;
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const token = url.searchParams.get("token");
  if (!token) {
    return Response.json({ error: "Missing token" }, { status: 400 });
  }

  const result = await getPreferenceContext(token);
  if (!result.ok) {
    return Response.json({ error: result.error }, { status: result.status });
  }

  return new Response(renderPreferencePage(token, result.data), {
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}

export async function PUT(request: Request) {
  let body: { token?: string; newsletterTypes?: string[] };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!body.token) {
    return Response.json({ error: "Missing token" }, { status: 400 });
  }

  const result = await updatePreferencesByToken(body.token, body.newsletterTypes || []);
  if (!result.ok) {
    return Response.json({ error: result.error }, { status: result.status });
  }

  return Response.json({ ok: true });
}
