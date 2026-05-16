import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import { Resend } from "resend";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Route for sending email
  app.post("/api/send-login-email", async (req, res) => {
    const { email, displayName } = req.body;
    if (!email) {
      return res.status(400).json({ error: "Email is required" });
    }

    const resendApiKey = process.env.RESEND_API_KEY;
    if (!resendApiKey) {
      console.warn("RESEND_API_KEY is not set. Simulating email send.");
      return res.status(200).json({ success: true, simulated: true });
    }

    const resend = new Resend(resendApiKey);

    try {
      const { data, error } = await resend.emails.send({
        from: "FinTrack Pro <onboarding@resend.dev>", // Using Resend's test domain
        to: [email],
        subject: "New Login to Your FinTrack Pro Account",
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #eaeaec; border-radius: 8px; padding: 24px;">
            <div style="text-align: center; margin-bottom: 24px;">
              <h1 style="margin: 0; color: #10B981;">FinTrack Pro</h1>
            </div>
            <h2 style="margin-top: 0;">Hello ${displayName || "User"},</h2>
            <p>We noticed a new login to your FinTrack Pro account.</p>
            <p style="background: #f4f4f5; padding: 12px; border-radius: 4px; font-size: 14px; font-family: monospace;">
              Time: ${new Date().toUTCString()}
            </p>
            <p>If this was you, you can safely ignore this email. If this wasn't you, please secure your account immediately.</p>
            <div style="margin-top: 32px; padding-top: 24px; border-top: 1px solid #eaeaec; font-size: 12px; color: #71717a; text-align: center;">
              &copy; ${new Date().getFullYear()} FinTrack Pro. All rights reserved.
            </div>
          </div>
        `,
      });

      if (error) {
        console.error("Error sending email:", error);
        return res.status(400).json({ error });
      }

      res.status(200).json({ success: true, data });
    } catch (err) {
      console.error("Exception sending email:", err);
      res.status(500).json({ error: "Internal Server Error" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
