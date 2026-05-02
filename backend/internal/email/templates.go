package email

import (
	"fmt"
	"html"
	"strings"
	"time"
)

type Message struct {
	Subject string
	HTML    string
}

func baseLayout(title string, body string) string {
	return fmt.Sprintf(`<!doctype html>
<html>
  <body style="margin:0;padding:0;background:#f4f7fb;font-family:Arial,sans-serif;color:#1f2937;">
    <div style="max-width:640px;margin:0 auto;padding:32px 16px;">
      <div style="background:#ffffff;border:1px solid #e5e7eb;border-radius:20px;overflow:hidden;">
        <div style="background:#163447;padding:28px 32px;color:#ffffff;">
          <div style="font-size:12px;letter-spacing:.12em;text-transform:uppercase;opacity:.8;">ConferenceSpace</div>
          <h1 style="margin:10px 0 0;font-size:28px;line-height:1.2;">%s</h1>
        </div>
        <div style="padding:32px;">%s</div>
      </div>
    </div>
  </body>
</html>`, html.EscapeString(title), body)
}

func button(url, label string) string {
	return fmt.Sprintf(
		`<p style="margin:24px 0;"><a href="%s" style="display:inline-block;background:#163447;color:#ffffff;text-decoration:none;padding:12px 18px;border-radius:10px;font-weight:700;">%s</a></p>`,
		html.EscapeString(url),
		html.EscapeString(label),
	)
}

func VerifyEmail(link string) Message {
	body := strings.Join([]string{
		`<p style="margin:0 0 16px;font-size:15px;line-height:1.7;">Please verify your email address to finish setting up your ConferenceSpace account.</p>`,
		button(link, "Verify email"),
		`<p style="margin:0;font-size:13px;line-height:1.7;color:#6b7280;">This link expires in 24 hours.</p>`,
	}, "")
	return Message{
		Subject: "Verify your ConferenceSpace email",
		HTML:    baseLayout("Verify your email", body),
	}
}

func ResetPassword(link string) Message {
	body := strings.Join([]string{
		`<p style="margin:0 0 16px;font-size:15px;line-height:1.7;">Use the button below to reset your ConferenceSpace password.</p>`,
		button(link, "Reset password"),
		`<p style="margin:0;font-size:13px;line-height:1.7;color:#6b7280;">This link expires in 1 hour.</p>`,
	}, "")
	return Message{
		Subject: "Reset your ConferenceSpace password",
		HTML:    baseLayout("Reset your password", body),
	}
}

func ConferenceInvitation(signupURL, inviteeEmail, roleLabel, conferenceName, inviterName string, expiresAt time.Time) Message {
	body := strings.Join([]string{
		fmt.Sprintf(`<p style="margin:0 0 16px;font-size:15px;line-height:1.7;">%s invited <strong>%s</strong> to join <strong>%s</strong> on ConferenceSpace.</p>`,
			html.EscapeString(inviterName),
			html.EscapeString(roleLabel),
			html.EscapeString(conferenceName),
		),
		fmt.Sprintf(`<p style="margin:0 0 16px;font-size:15px;line-height:1.7;">This invitation was sent to <strong>%s</strong>. Create your account with that email address, then review and accept the invitation from the invitation page.</p>`,
			html.EscapeString(inviteeEmail),
		),
		button(signupURL, "Create account and review invitation"),
		fmt.Sprintf(`<p style="margin:0;font-size:13px;line-height:1.7;color:#6b7280;">This invitation expires on %s.</p>`,
			html.EscapeString(expiresAt.Format("January 2, 2006")),
		),
	}, "")
	return Message{
		Subject: fmt.Sprintf("Invitation to join %s as %s", conferenceName, roleLabel),
		HTML:    baseLayout("Conference invitation", body),
	}
}
