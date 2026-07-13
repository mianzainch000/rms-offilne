require("dotenv").config();
const nodemailer = require("nodemailer");

// Accept either naming — SMTP_USER/SMTP_PASS or OWNER_EMAIL/OWNER_PASS —
// so it works with whatever the .env.local already has.
const SMTP_USER = process.env.SMTP_USER || process.env.OWNER_EMAIL;
const SMTP_PASS = process.env.SMTP_PASS || process.env.OWNER_PASS;
const SMTP_FROM = process.env.SMTP_FROM || SMTP_USER;

function isEmailConfigured() {
    return Boolean(SMTP_USER && SMTP_PASS);
}

function getTransporter() {
    // Works out of the box with Gmail: SMTP_USER/OWNER_EMAIL = the gmail
    // address, SMTP_PASS/OWNER_PASS = a 16-character Gmail "App Password"
    // (https://myaccount.google.com/apppasswords) — a normal Gmail login
    // password will NOT work here.
    //
    // For any other provider, set SMTP_HOST / SMTP_PORT as well and it will
    // be used instead of the Gmail shortcut.
    if (process.env.SMTP_HOST) {
        return nodemailer.createTransport({
            host: process.env.SMTP_HOST,
            port: Number(process.env.SMTP_PORT) || 587,
            secure: Number(process.env.SMTP_PORT) === 465,
            auth: {
                user: SMTP_USER,
                pass: SMTP_PASS,
            },
        });
    }

    return nodemailer.createTransport({
        service: "gmail",
        auth: {
            user: SMTP_USER,
            pass: SMTP_PASS,
        },
    });
}

async function sendPasswordResetEmail({ to, resetLink, restaurantName }) {
    if (!isEmailConfigured()) {
        const err = new Error(
            "Email service is not configured. Set SMTP_USER/SMTP_PASS (or OWNER_EMAIL/OWNER_PASS) in .env.local",
        );
        err.code = "EMAIL_NOT_CONFIGURED";
        throw err;
    }

    const transporter = getTransporter();
    const brand = restaurantName || "Restaurant Management System";

    await transporter.sendMail({
        from: SMTP_FROM,
        to,
        subject: `Reset your ${brand} password`,
        html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          <title>Reset your ${brand} password</title>
        </head>
        <body style="margin:0;padding:0;background-color:#f3f4f6;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0"
                 style="background-color:#f3f4f6;padding:24px 12px;">
            <tr>
              <td align="center">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0"
                       style="max-width:480px;width:100%;background:#ffffff;border-radius:10px;
                              overflow:hidden;font-family:Arial,Helvetica,sans-serif;">
                  <tr>
                    <td style="padding:28px 28px 8px 28px;">
                      <h2 style="margin:0 0 16px 0;color:#b45309;font-size:20px;">
                        ${brand}
                      </h2>
                      <p style="margin:0 0 20px 0;color:#374151;font-size:14px;line-height:1.6;">
                        We received a request to reset your account password.
                      </p>
                    </td>
                  </tr>
                  <tr>
                    <td align="center" style="padding:0 28px 24px 28px;">
                      <a href="${resetLink}"
                         style="display:inline-block;background:#b45309;color:#ffffff;
                                font-size:14px;font-weight:bold;padding:12px 28px;
                                border-radius:6px;text-decoration:none;">
                        Reset Password
                      </a>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding:0 28px 28px 28px;">
                      <p style="margin:0;color:#6b7280;font-size:12.5px;line-height:1.6;">
                        This link will expire in 15 minutes. If you didn't request this,
                        you can safely ignore this email.
                      </p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </body>
      </html>
    `,
    });
}

module.exports = { sendPasswordResetEmail, isEmailConfigured };