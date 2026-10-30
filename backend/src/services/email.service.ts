type AppsScriptReply = { success?: boolean; message?: string };

export function isEmailServiceConfigured() {
  return Boolean(process.env.APPS_SCRIPT_URL);
}

export async function sendEmail(to: string, subject: string, html: string) {
  const url = process.env.APPS_SCRIPT_URL;
  if (!url) throw new Error("Email delivery is not configured.");
  let response: Response;
  try {
    response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ to, subject, html }),
      signal: AbortSignal.timeout(12_000),
    });
  } catch {
    throw new Error("Email delivery failed.");
  }
  let data: AppsScriptReply;
  try { data = await response.json() as AppsScriptReply; }
  catch { throw new Error("Email delivery failed."); }
  if (!response.ok || data.success !== true) throw new Error("Email delivery failed.");
}

export async function sendAdminPasswordOtp(to: string, otp: string) {
  await sendEmail(to, "Udaan Learning Centre admin password reset", `<p>Your Udaan admin password reset code is:</p><p style="font-size:28px;font-weight:700;letter-spacing:8px">${otp}</p><p>This code expires in 10 minutes. If you did not request this, ignore this email.</p>`);
}

export async function sendAdminEmailVerificationOtp(to: string, otp: string) {
  await sendEmail(to, "Verify your Udaan Learning Centre email", `<p>Use this code to verify your new Udaan admin email address:</p><p style="font-size:28px;font-weight:700;letter-spacing:8px">${otp}</p><p>This code expires in 10 minutes. If you did not request this, ignore this email.</p>`);
}
