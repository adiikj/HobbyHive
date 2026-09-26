/**
 * The sign-up code email. Email clients strip <style> blocks and block SVG and data URIs, so this is
 * table-based with inline styles only, and the brand is drawn with coloured cells and text rather than images.
 */

// Every hive's colour, drawn as a strip across the top (same order as the site footer)
const HIVE_COLORS = ["#DB2777", "#FFB703", "#FF6F61", "#2C7A7B", "#8B5CF6", "#F59E0B", "#3B82F6", "#F97316", "#6366F1", "#64748B", "#10B981", "#78716C"];
const PINK = "#DB2777";
const INK = "#212529";
const MUTED = "#6C757D";
const CANVAS = "#F5F5F3";
const FONT = "'Helvetica Neue', Helvetica, Arial, sans-serif";

const escapeHtml = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");

export interface OtpEmail {
  subject: string;
  html: string;
  text: string;
}

export function otpEmail({ otp, name, minutes = 10 }: { otp: string; name?: string | null; minutes?: number }): OtpEmail {
  const firstName = name?.trim().split(/\s+/)[0] ?? "";
  const greeting = firstName ? `Hi ${escapeHtml(firstName)},` : "Hi there,";
  const preheader = `Use this code within ${minutes} minutes to finish joining HobbyHive.`;

  const strip = HIVE_COLORS.map((c) => `<td style="height:5px;background:${c};font-size:0;line-height:0;">&nbsp;</td>`).join("");

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="color-scheme" content="light">
<title>Your HobbyHive code</title>
</head>
<body style="margin:0;padding:0;background:${CANVAS};">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">${escapeHtml(preheader)}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${CANVAS};">
  <tr>
    <td align="center" style="padding:32px 16px;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:480px;background:#FFFFFF;border-radius:20px;overflow:hidden;border:1px solid #E9E9E6;">
        <tr><td style="padding:0;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr>${strip}</tr></table></td></tr>
        <tr>
          <td style="padding:32px 32px 8px 32px;font-family:${FONT};">
            <table role="presentation" cellpadding="0" cellspacing="0" border="0">
              <tr>
                <td valign="middle" style="width:14px;"><div style="width:14px;height:14px;background:${PINK};border-radius:4px;font-size:0;line-height:0;">&nbsp;</div></td>
                <td style="padding-left:8px;font-family:Impact, 'Arial Narrow Bold', ${FONT};font-size:22px;letter-spacing:1px;color:${PINK};font-weight:bold;">HOBBYHIVE</td>
              </tr>
            </table>
          </td>
        </tr>
        <tr>
          <td style="padding:16px 32px 0 32px;font-family:${FONT};color:${INK};">
            <p style="margin:0 0 8px 0;font-size:16px;line-height:24px;">${greeting}</p>
            <p style="margin:0;font-size:16px;line-height:24px;color:#495057;">Here&rsquo;s your code to finish joining HobbyHive. Pop it into the sign-up page.</p>
          </td>
        </tr>
        <tr>
          <td align="center" style="padding:28px 16px;">
            <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="background:#FDF2F8;border:1px solid #FBCFE8;border-radius:16px;">
              <tr>
                <td align="center" style="padding:18px 20px 18px 28px;font-family:'SFMono-Regular', Menlo, Consolas, 'Courier New', monospace;font-size:30px;line-height:36px;font-weight:bold;letter-spacing:8px;white-space:nowrap;color:${INK};">${escapeHtml(otp)}</td>
              </tr>
            </table>
            <p style="margin:12px 0 0 0;font-family:${FONT};font-size:13px;line-height:20px;color:${MUTED};">This code expires in <strong style="color:${INK};">${minutes} minutes</strong>.</p>
          </td>
        </tr>
        <tr>
          <td style="padding:0 32px 28px 32px;font-family:${FONT};">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${CANVAS};border-radius:14px;">
              <tr>
                <td style="padding:14px 16px;font-size:14px;line-height:21px;color:#495057;">
                  <strong style="color:${INK};">Next up:</strong> pick your hives, then start this week&rsquo;s challenge or log your first practice session.
                </td>
              </tr>
            </table>
          </td>
        </tr>
        <tr>
          <td style="padding:0 32px 32px 32px;font-family:${FONT};font-size:12px;line-height:18px;color:${MUTED};border-top:1px solid #F1F1EE;">
            <p style="margin:20px 0 0 0;">Didn&rsquo;t try to sign up? You can safely ignore this email; no account is created without this code.</p>
          </td>
        </tr>
      </table>
      <p style="margin:16px 0 0 0;font-family:${FONT};font-size:12px;line-height:18px;color:#ADB5BD;">HobbyHive &middot; One hobby, one hive.</p>
    </td>
  </tr>
</table>
</body>
</html>`;

  const text = [
    firstName ? `Hi ${firstName},` : "Hi there,",
    "",
    "Here's your code to finish joining HobbyHive:",
    "",
    `    ${otp}`,
    "",
    `It expires in ${minutes} minutes.`,
    "",
    "Next up: pick your hives, then start this week's challenge or log your first practice session.",
    "",
    "Didn't try to sign up? You can safely ignore this email; no account is created without this code.",
    "",
    "HobbyHive",
  ].join("\n");

  return { subject: `${otp} is your HobbyHive code`, html, text };
}
