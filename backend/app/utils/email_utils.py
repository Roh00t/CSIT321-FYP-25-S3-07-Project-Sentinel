# backend/app/utils/email_utils.py
import os
from dotenv import load_dotenv
load_dotenv()
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

def send_alert_email(to_email, subject, message_body):
    """
    Send an alert email to the specified address.
    You must configure SMTP server details below.
    """
    SMTP_SERVER = os.getenv("SMTP_SERVER", "smtp.gmail.com")
    SMTP_PORT = int(os.getenv("SMTP_PORT", 587))
    SMTP_USERNAME = os.getenv("SMTP_USERNAME", "your_email@gmail.com")
    SMTP_PASSWORD = os.getenv("SMTP_PASSWORD", "your_password")
    FROM_EMAIL = os.getenv("FROM_EMAIL", SMTP_USERNAME)

    print(f"[EMAIL] SMTP_SERVER: {SMTP_SERVER}")
    print(f"[EMAIL] SMTP_PORT: {SMTP_PORT}")
    print(f"[EMAIL] SMTP_USERNAME: {SMTP_USERNAME}")
    print(f"[EMAIL] FROM_EMAIL: {FROM_EMAIL}")

    msg = MIMEMultipart()
    msg["From"] = FROM_EMAIL
    msg["To"] = to_email
    msg["Subject"] = subject
    msg.attach(MIMEText(message_body, "plain"))

    try:
        print(f"[EMAIL] Attempting to send email to {to_email} with subject '{subject}'")
        with smtplib.SMTP(SMTP_SERVER, SMTP_PORT) as server:
            server.starttls()
            server.login(SMTP_USERNAME, SMTP_PASSWORD)
            server.sendmail(FROM_EMAIL, to_email, msg.as_string())
        print(f"[EMAIL] Successfully sent to {to_email}")
        return True
    except Exception as e:
        print(f"[EMAIL] Failed to send to {to_email}: {str(e)}")
        return False
