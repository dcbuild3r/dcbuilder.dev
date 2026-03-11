import { confirmNewsletterSubscription } from "@/services/newsletter";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const token = url.searchParams.get("token");
  if (!token) {
    return Response.json({ error: "Missing token" }, { status: 400 });
  }

  const result = await confirmNewsletterSubscription(token);
  if (!result.ok) {
    return Response.json({ error: result.error }, { status: result.status });
  }

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://dcbuilder.dev";
  return new Response(
    `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Subscription confirmed</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif;
      background: #fafafa;
      color: #171717;
    }
    .card {
      max-width: 400px;
      width: 100%;
      margin: 24px;
      padding: 48px 32px;
      background: #fff;
      border: 1px solid #e5e5e5;
      border-radius: 16px;
      text-align: center;
    }
    .check {
      width: 56px;
      height: 56px;
      margin: 0 auto 24px;
      background: #171717;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .check svg { width: 28px; height: 28px; }
    h1 { font-size: 22px; font-weight: 700; margin-bottom: 8px; }
    p { font-size: 15px; color: #525252; line-height: 1.5; margin-bottom: 24px; }
    a {
      display: inline-block;
      background: #171717;
      color: #fff;
      font-size: 14px;
      font-weight: 600;
      padding: 10px 28px;
      border-radius: 8px;
      text-decoration: none;
    }
    a:hover { background: #404040; }
  </style>
</head>
<body>
  <div class="card">
    <div class="check">
      <svg fill="none" viewBox="0 0 24 24" stroke="white" stroke-width="2.5">
        <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
      </svg>
    </div>
    <h1>You're subscribed!</h1>
    <p>Your subscription has been confirmed. You'll receive updates in your inbox soon.</p>
    <a href="${baseUrl}/news">Browse latest news</a>
  </div>
</body>
</html>`,
    { headers: { "Content-Type": "text/html; charset=utf-8" } }
  );
}
