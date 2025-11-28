"""
Email Service for sending invitations and notifications
"""

import os
import smtplib
import ssl
import time
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from typing import Optional

class EmailService:
    """Service for sending emails"""
    
    def __init__(self):
        self._load_config()
        self.last_error_message: Optional[str] = None
        self.last_error_port: Optional[int] = None
    
    def _load_config(self):
        """Load email configuration from environment variables"""
        self.smtp_host = os.environ.get('SMTP_HOST', 'smtp.gmail.com')
        self.smtp_port = int(os.environ.get('SMTP_PORT', '587'))
        self.smtp_user = os.environ.get('SMTP_USER')
        self.smtp_password = os.environ.get('SMTP_PASSWORD')
        self.from_email = os.environ.get('FROM_EMAIL', self.smtp_user)
        self.from_name = os.environ.get('FROM_NAME', 'MeallensAI')
        timeout_env = os.environ.get('SMTP_TIMEOUT', '30')
        retry_env = os.environ.get('SMTP_RETRY_ATTEMPTS', '3')
        use_ssl_env = os.environ.get('SMTP_USE_SSL')
        port_list_env = os.environ.get('SMTP_PORTS')
        auto_fallback_env = os.environ.get('SMTP_ENABLE_PORT_FALLBACK', 'true')

        try:
            self.smtp_timeout = max(5, int(timeout_env))
        except ValueError:
            self.smtp_timeout = 30

        try:
            self.smtp_retry_attempts = max(1, int(retry_env))
        except ValueError:
            self.smtp_retry_attempts = 3

        self._smtp_use_ssl_explicit = False
        if use_ssl_env is not None:
            self.smtp_use_ssl = use_ssl_env.strip().lower() in ('1', 'true', 'yes', 'on')
            self._smtp_use_ssl_explicit = True
        else:
            self.smtp_use_ssl = self.smtp_port == 465

        # Build ordered list of port candidates
        candidate_ports = []
        if port_list_env:
            for raw_port in port_list_env.split(','):
                cleaned = raw_port.strip()
                if not cleaned:
                    continue
                try:
                    port_val = int(cleaned)
                    if port_val not in candidate_ports:
                        candidate_ports.append(port_val)
                except ValueError:
                    print(f"[EmailService] Ignoring invalid SMTP_PORTS entry: {cleaned}")
        else:
            candidate_ports.append(self.smtp_port)

        auto_fallback_enabled = auto_fallback_env.strip().lower() in ('1', 'true', 'yes', 'on')
        if auto_fallback_enabled:
            # Append common ports (465 SSL, 587 STARTTLS, 25 plain) if not already present
            for fallback_port in (465, 587, 25):
                if fallback_port not in candidate_ports:
                    candidate_ports.append(fallback_port)

        self.smtp_port_candidates = candidate_ports

        if not self.from_email:
            self.from_email = self.smtp_user
        
        # Check if email is configured
        self.is_configured = bool(self.smtp_user and self.smtp_password)
        
        if not self.is_configured:
            print("Warning: Email service not configured. Set SMTP_USER and SMTP_PASSWORD environment variables.")

    def _send_email_message(self, msg: MIMEMultipart, to_email: str) -> bool:
        """
        Send an email message with retry and timeout safeguards.
        """
        if not self.is_configured:
            return False

        last_error: Optional[Exception] = None
        self.last_error_message = None
        self.last_error_port = None
        context = ssl.create_default_context()

        for port in self.smtp_port_candidates:
            for attempt in range(1, self.smtp_retry_attempts + 1):
                try:
                    # Decide whether to use SSL for this port
                    port_use_ssl = self.smtp_use_ssl if self._smtp_use_ssl_explicit else (port == 465)

                    if port_use_ssl:
                        with smtplib.SMTP_SSL(
                            self.smtp_host,
                            port,
                            timeout=self.smtp_timeout,
                            context=context
                        ) as server:
                            server.login(self.smtp_user, self.smtp_password)
                            server.send_message(msg)
                    else:
                        with smtplib.SMTP(self.smtp_host, port, timeout=self.smtp_timeout) as server:
                            server.ehlo()

                            should_attempt_starttls = True
                            if not self._smtp_use_ssl_explicit and port == 25:
                                # Some providers block STARTTLS on port 25; try plain first
                                should_attempt_starttls = False

                            if should_attempt_starttls:
                                if server.has_extn('starttls'):
                                    server.starttls(context=context)
                                    server.ehlo()
                                else:
                                    print(f"[EmailService] STARTTLS not supported on port {port}, sending without TLS.")

                            server.login(self.smtp_user, self.smtp_password)
                            server.send_message(msg)

                    print(f"Email sent to {to_email} via port {port} (attempt {attempt})")
                    self.last_error_message = None
                    self.last_error_port = None
                    return True
                except Exception as exc:
                    last_error = exc
                    self.last_error_message = str(exc)
                    self.last_error_port = port
                    print(f"Attempt {attempt} on port {port} to send email to {to_email} failed: {exc}")
                    if attempt < self.smtp_retry_attempts:
                        time.sleep(min(2 * attempt, 5))

        print(f"Failed to send email to {to_email}: {last_error}")
        return False
    
    def send_invitation_email(
        self, 
        to_email: str, 
        enterprise_name: str, 
        inviter_name: str,
        invitation_link: str,
        custom_message: Optional[str] = None
    ) -> bool:
        """
        Send an invitation email to a user
        
        Args:
            to_email: Recipient email address
            enterprise_name: Name of the organization
            inviter_name: Name of the person inviting
            invitation_link: Link to accept the invitation
            custom_message: Optional custom message from inviter
            
        Returns:
            bool: True if email sent successfully, False otherwise
        """
        
        # Reload config in case environment variables were set after initialization
        self._load_config()
        
        if not self.is_configured:
            print(f"Email not configured. Invitation link: {invitation_link}")
            return False
        
        try:
            # Create message
            msg = MIMEMultipart('alternative')
            msg['Subject'] = f'Invitation to join {enterprise_name} on MeallensAI'
            msg['From'] = f'{self.from_name} <{self.from_email}>'
            msg['To'] = to_email
            
            # Create HTML email body
            html_body = f"""
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <style>
                    body {{
                        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
                        line-height: 1.6;
                        color: #333;
                        max-width: 600px;
                        margin: 0 auto;
                        padding: 20px;
                    }}
                    .container {{
                        background-color: #ffffff;
                        border: 1px solid #e0e0e0;
                        padding: 30px;
                    }}
                    .header {{
                        text-align: center;
                        margin-bottom: 30px;
                    }}
                    .logo {{
                        font-size: 28px;
                        font-weight: bold;
                        color: #4CAF50;
                    }}
                    .content {{
                        margin-bottom: 30px;
                    }}
                    .button {{
                        display: inline-block;
                        padding: 15px 30px;
                        background-color: #4CAF50;
                        color: white !important;
                        text-decoration: none;
                        font-weight: bold;
                        text-align: center;
                        margin: 20px 0;
                    }}
                    .button:hover {{
                        background-color: #45a049;
                    }}
                    .custom-message {{
                        background-color: #f5f5f5;
                        border-left: 4px solid #4CAF50;
                        padding: 15px;
                        margin: 20px 0;
                        font-style: italic;
                    }}
                    .footer {{
                        margin-top: 30px;
                        padding-top: 20px;
                        border-top: 1px solid #e0e0e0;
                        font-size: 12px;
                        color: #666;
                        text-align: center;
                    }}
                    .link {{
                        color: #4CAF50;
                        word-break: break-all;
                    }}
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <div class="logo">MeallensAI</div>
                    </div>
                    
                    <div class="content">
                        <h2>You've been invited!</h2>
                        
                        <p>Hello,</p>
                        
                        <p><strong>{inviter_name}</strong> has invited you to join <strong>{enterprise_name}</strong> on MeallensAI.</p>
                        
                        {f'<div class="custom-message"><strong>Personal message:</strong><br>{custom_message}</div>' if custom_message else ''}
                        
                        <p>MeallensAI is an AI-powered nutrition and meal planning platform that helps you make healthier food choices and create personalized meal plans.</p>
                        
                        <p>Click the button below to accept the invitation and get started:</p>
                        
                        <div style="text-align: center;">
                            <a href="{invitation_link}" class="button">Accept Invitation</a>
                        </div>
                        
                        <p>Or copy and paste this link into your browser:</p>
                        <p class="link">{invitation_link}</p>
                        
                        <p><small>This invitation will expire in 30 days.</small></p>
                    </div>
                    
                    <div class="footer">
                        <p>This email was sent to {to_email} because {inviter_name} invited you to join their organization on MeallensAI.</p>
                        <p>&copy; 2025 MeallensAI. All rights reserved.</p>
                    </div>
                </div>
            </body>
            </html>
            """
            
            # Create plain text version as fallback
            text_body = f"""
            You've been invited to join {enterprise_name} on MeallensAI!
            
            {inviter_name} has invited you to join their organization on MeallensAI.
            
            {f'Personal message: {custom_message}' if custom_message else ''}
            
            MeallensAI is an AI-powered nutrition and meal planning platform that helps you make healthier food choices and create personalized meal plans.
            
            Accept your invitation by visiting this link:
            {invitation_link}
            
            This invitation will expire in 30 days.
            
            ---
            This email was sent to {to_email} because {inviter_name} invited you to join their organization on MeallensAI.
            © 2025 MeallensAI. All rights reserved.
            """
            
            # Attach both versions
            msg.attach(MIMEText(text_body, 'plain'))
            msg.attach(MIMEText(html_body, 'html'))
            
            return self._send_email_message(msg, to_email)
            
        except Exception as e:
            print(f"Failed to prepare invitation email to {to_email}: {str(e)}")
            return False
    
    def send_welcome_email(self, to_email: str, enterprise_name: str) -> bool:
        """
        Send a welcome email to a user who accepted an invitation
        
        Args:
            to_email: Recipient email address
            enterprise_name: Name of the organization they joined
            
        Returns:
            bool: True if email sent successfully, False otherwise
        """
        
        # Reload config in case environment variables were set after initialization
        self._load_config()
        
        if not self.is_configured:
            print("Email not configured. Welcome email not sent.")
            return False
        
        try:
            msg = MIMEMultipart('alternative')
            msg['Subject'] = f'Welcome to {enterprise_name} on MeallensAI!'
            msg['From'] = f'{self.from_name} <{self.from_email}>'
            msg['To'] = to_email
            
            html_body = f"""
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <style>
                    body {{
                        font-family: Arial, sans-serif;
                        line-height: 1.6;
                        color: #333;
                        max-width: 600px;
                        margin: 0 auto;
                        padding: 20px;
                    }}
                    .container {{
                        background-color: #ffffff;
                        border: 1px solid #e0e0e0;
                        padding: 30px;
                    }}
                    .header {{
                        text-align: center;
                        margin-bottom: 30px;
                    }}
                    .logo {{
                        font-size: 28px;
                        font-weight: bold;
                        color: #4CAF50;
                    }}
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <div class="logo">MeallensAI</div>
                    </div>
                    
                    <h2>Welcome to MeallensAI! 🎉</h2>
                    
                    <p>Congratulations! You've successfully joined <strong>{enterprise_name}</strong> on MeallensAI.</p>
                    
                    <p>You now have access to:</p>
                    <ul>
                        <li>AI-powered food detection and analysis</li>
                        <li>Personalized meal planning</li>
                        <li>Nutritional guidance tailored to your needs</li>
                        <li>Access to recipes and meal suggestions</li>
                    </ul>
                    
                    <p>Get started by logging in to your account and exploring the features!</p>
                    
                    <p>If you have any questions, don't hesitate to reach out to your healthcare provider or our support team.</p>
                    
                    <p>Best regards,<br>
                    The MeallensAI Team</p>
                </div>
            </body>
            </html>
            """
            
            msg.attach(MIMEText(html_body, 'html'))
            
            return self._send_email_message(msg, to_email)
            
        except Exception as e:
            print(f"Failed to prepare welcome email to {to_email}: {str(e)}")
            return False

    def send_user_creation_email(
        self, 
        to_email: str, 
        enterprise_name: str, 
        inviter_name: str,
        login_url: str = os.environ.get('FRONTEND_URL', 'https://www.meallensai.com') + "/accept-invitation"
    ) -> bool:
        """
        Send an email to a user who was created by an organization admin
        
        Args:
            to_email: Recipient email address
            enterprise_name: Name of the organization
            inviter_name: Name of the person who created the account
            login_url: URL to the login page
            
        Returns:
            bool: True if email sent successfully, False otherwise
        """
        
        # Reload config in case environment variables were set after initialization
        self._load_config()
        
        if not self.is_configured:
            print("Email not configured. User creation email not sent.")
            return False
        
        try:
            msg = MIMEMultipart('alternative')
            msg['Subject'] = f'Your MeallensAI account has been created - {enterprise_name}'
            msg['From'] = f'{self.from_name} <{self.from_email}>'
            msg['To'] = to_email
            
            html_body = f"""
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <style>
                    body {{
                        font-family: Arial, sans-serif;
                        line-height: 1.6;
                        color: #333;
                        max-width: 600px;
                        margin: 0 auto;
                        padding: 20px;
                    }}
                    .container {{
                        background-color: #ffffff;
                        border: 1px solid #e0e0e0;
                        padding: 30px;
                    }}
                    .header {{
                        text-align: center;
                        margin-bottom: 30px;
                    }}
                    .logo {{
                        font-size: 28px;
                        font-weight: bold;
                        color: #4CAF50;
                    }}
                    .button {{
                        display: inline-block;
                        background-color: #4CAF50;
                        color: white;
                        padding: 12px 24px;
                        text-decoration: none;
                        border-radius: 5px;
                        font-weight: bold;
                        margin: 20px 0;
                    }}
                    .credentials {{
                        background-color: #f9f9f9;
                        border: 1px solid #ddd;
                        padding: 15px;
                        border-radius: 5px;
                        margin: 20px 0;
                    }}
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <div class="logo">MeallensAI</div>
                    </div>
                    
                    <h2>Your account has been created! 🎉</h2>
                    
                    <p>Hello,</p>
                    
                    <p><strong>{inviter_name}</strong> has created an account for you and added you to <strong>{enterprise_name}</strong> on MeallensAI.</p>
                    
                    <p>MeallensAI is an AI-powered nutrition and meal planning platform that helps you make healthier food choices and create personalized meal plans.</p>
                    
                    <div class="credentials">
                        <h3>Your Login Information:</h3>
                        <p><strong>Email:</strong> {to_email}</p>
                        <p><strong>Password:</strong> [The password set by your organization admin]</p>
                    </div>
                    
                    <p>Click the button below to log in and get started:</p>
                    
                    <div style="text-align: center;">
                        <a href="{login_url}" class="button" target="_blank">Login to MeallensAI</a>
                    </div>
                    
                    <p>Or copy and paste this link into your browser:</p>
                    <p style="word-break: break-all; color: #666;">{login_url}</p>
                    
                    <p style="font-size: 12px; color: #666; margin-top: 20px;">
                        <strong>Note:</strong> If you're already logged in as someone else, please log out first or open this link in a new browser tab/incognito window.
                    </p>
                    
                    <p>Once logged in, you'll have access to:</p>
                    <ul>
                        <li>AI-powered food detection and analysis</li>
                        <li>Personalized meal planning</li>
                        <li>Nutritional guidance tailored to your needs</li>
                        <li>Access to recipes and meal suggestions</li>
                    </ul>
                    
                    <p>If you have any questions, please contact your organization administrator.</p>
                    
                    <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
                    
                    <p style="font-size: 12px; color: #666;">
                        This email was sent to {to_email} because {inviter_name} created an account for you on MeallensAI.<br>
                        © 2025 MeallensAI. All rights reserved.
                    </p>
                </div>
            </body>
            </html>
            """
            
            # Create the HTML part
            html_part = MIMEText(html_body, 'html')
            msg.attach(html_part)
            
            return self._send_email_message(msg, to_email)
            
        except Exception as e:
            print(f"Error preparing user creation email: {e}")
            return False


# Create a singleton instance
email_service = EmailService()

