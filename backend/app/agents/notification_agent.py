import logging
import smtplib
from email.message import EmailMessage
from typing import Any, Dict
from sqlalchemy.ext.asyncio import AsyncSession
from app.models import NotificationHistory
from app.config import settings

logger = logging.getLogger(__name__)

class NotificationAgent:
    """
    Email Notification Engine using SMTP.
    """

    def _send_email(self, subject: str, content: str, recipient: str) -> bool:
        # Mock SMTP sending. In production, this would use configured SMTP details.
        # EMAIL_HOST = settings.EMAIL_HOST or "smtp.gmail.com"
        logger.info(f"Sending email to {recipient} with subject '{subject}'")
        try:
            # msg = EmailMessage()
            # msg.set_content(content)
            # msg['Subject'] = subject
            # msg['From'] = settings.EMAIL_USERNAME
            # msg['To'] = recipient
            # with smtplib.SMTP(EMAIL_HOST, settings.EMAIL_PORT) as s:
            #     s.starttls()
            #     s.login(settings.EMAIL_USERNAME, settings.EMAIL_PASSWORD)
            #     s.send_message(msg)
            return True
        except Exception as e:
            logger.error(f"Failed to send email: {e}")
            return False

    async def send_security_alert(self, db: AsyncSession, incident_id: str, severity: str, risk_score: float, details: Dict[str, Any]):
        recipient = "admin@securenet.ai" # Or from settings.EMAIL_RECEIVER
        
        content = f"""
        SECURENET AI SECURITY ALERT
        
        Incident ID: {incident_id}
        Threat: {details.get('attack', 'ANOMALY')}
        Severity: {severity}
        Risk Score: {risk_score}
        
        Time: {details.get('timestamp')}
        """
        
        success = self._send_email(f"Security Alert: {severity} Threat Detected", content, recipient)
        
        history = NotificationHistory(
            notification_id=f"NOTIF-{incident_id}",
            incident_id=incident_id,
            type="SECURITY_ALERT",
            recipient=recipient,
            status="SENT" if success else "FAILED"
        )
        db.add(history)

notification_agent = NotificationAgent()
