# backend/app/utils/email_utils.py
import os
from sendgrid import SendGridAPIClient
from sendgrid.helpers.mail import Mail

def send_alert_email(to_email, subject, message_body):
    SENDGRID_API_KEY = os.getenv("SENDGRID_API_KEY")
    FROM_EMAIL = os.getenv("SENDGRID_FROM_EMAIL", to_email)

    print(f"[EMAIL] SENDGRID_FROM_EMAIL: {FROM_EMAIL}")
    print(f"[EMAIL] SENDGRID_API_KEY present: {bool(SENDGRID_API_KEY)}")
    print(f"[EMAIL] Attempting to send email to {to_email} with subject '{subject}' via SendGrid")

    message = Mail(
        from_email=FROM_EMAIL,
        to_emails=to_email,
        subject=subject,
        plain_text_content=message_body
    )
    try:
        sg = SendGridAPIClient(SENDGRID_API_KEY)
        response = sg.send(message)
        print(f"[EMAIL] SendGrid response: {response.status_code}")
        return response.status_code == 202
    except Exception as e:
        print(f"[EMAIL] SendGrid error: {str(e)}")
        return False
