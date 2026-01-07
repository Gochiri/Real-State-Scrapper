import re
from typing import Optional, Tuple, List
from email_validator import validate_email, EmailNotValidError
import httpx
from bs4 import BeautifulSoup


class ContactValidator:
    """Validates and extracts contact information"""

    # Argentine phone patterns
    PHONE_PATTERNS = [
        r"\+54\s*9?\s*\d{2,4}\s*\d{3,4}\s*\d{4}",  # +54 9 11 1234 5678
        r"\(?\d{2,4}\)?\s*\d{3,4}[-\s]?\d{4}",      # (11) 1234-5678
        r"(?:15)?\s*\d{4}[-\s]?\d{4}",              # 15 1234-5678
    ]

    # Common email patterns to extract
    EMAIL_PATTERN = r"[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}"

    # Generic emails to flag (less valuable)
    GENERIC_EMAILS = [
        "info@",
        "contacto@",
        "ventas@",
        "consultas@",
        "admin@",
        "administracion@",
        "recepcion@",
        "hola@",
        "contact@",
        "sales@",
        "support@",
    ]

    @staticmethod
    def validate_email_address(email: str) -> Tuple[bool, Optional[str]]:
        """
        Validate an email address.

        Args:
            email: Email address to validate

        Returns:
            Tuple of (is_valid, normalized_email or error_message)
        """
        try:
            # Validate and normalize
            valid = validate_email(email, check_deliverability=False)
            return True, valid.normalized
        except EmailNotValidError as e:
            return False, str(e)

    @classmethod
    def is_generic_email(cls, email: str) -> bool:
        """Check if email is a generic/info type address"""
        email_lower = email.lower()
        return any(generic in email_lower for generic in cls.GENERIC_EMAILS)

    @staticmethod
    def normalize_phone(phone: str) -> str:
        """
        Normalize Argentine phone number to standard format.

        Args:
            phone: Raw phone number

        Returns:
            Normalized phone in format +54 9 XX XXXX XXXX
        """
        # Remove all non-digit characters
        digits = re.sub(r"\D", "", phone)

        # Handle different formats
        if digits.startswith("549"):
            # Already has country + mobile code
            digits = digits
        elif digits.startswith("54"):
            # Has country code, might need 9
            if len(digits) == 13:
                digits = digits  # Already complete
            else:
                digits = "54" + "9" + digits[2:]
        elif digits.startswith("9"):
            # Has mobile code
            digits = "54" + digits
        elif digits.startswith("15"):
            # Old mobile prefix, need to add area code (assuming BA)
            digits = "5491" + digits[2:]
        elif len(digits) == 10:
            # Full number without country code
            digits = "549" + digits
        elif len(digits) == 8:
            # Just the number, assume Buenos Aires (11)
            digits = "54911" + digits

        # Format nicely
        if len(digits) >= 12:
            return f"+{digits[0:2]} {digits[2]} {digits[3:5]} {digits[5:9]} {digits[9:]}"

        return phone  # Return original if can't normalize

    @staticmethod
    def validate_phone(phone: str) -> Tuple[bool, Optional[str]]:
        """
        Validate an Argentine phone number.

        Args:
            phone: Phone number to validate

        Returns:
            Tuple of (is_valid, normalized_phone or error_message)
        """
        digits = re.sub(r"\D", "", phone)

        # Argentine phone should have 10-13 digits
        if len(digits) < 8:
            return False, "Phone too short"
        if len(digits) > 15:
            return False, "Phone too long"

        normalized = ContactValidator.normalize_phone(phone)
        return True, normalized

    @classmethod
    def extract_emails_from_html(cls, html: str) -> List[str]:
        """
        Extract all email addresses from HTML content.

        Args:
            html: HTML content to search

        Returns:
            List of found email addresses
        """
        emails = re.findall(cls.EMAIL_PATTERN, html, re.IGNORECASE)

        # Clean and deduplicate
        valid_emails = []
        seen = set()

        for email in emails:
            email = email.lower().strip()

            # Skip common false positives
            if email.endswith((".png", ".jpg", ".gif", ".js", ".css")):
                continue

            # Skip already seen
            if email in seen:
                continue

            # Validate
            is_valid, _ = cls.validate_email_address(email)
            if is_valid:
                valid_emails.append(email)
                seen.add(email)

        return valid_emails

    @classmethod
    def extract_phones_from_html(cls, html: str) -> List[str]:
        """
        Extract phone numbers from HTML content.

        Args:
            html: HTML content to search

        Returns:
            List of found phone numbers
        """
        phones = []

        for pattern in cls.PHONE_PATTERNS:
            matches = re.findall(pattern, html)
            phones.extend(matches)

        # Also look for tel: links
        tel_pattern = r'href=["\']tel:([^"\']+)["\']'
        tel_matches = re.findall(tel_pattern, html, re.IGNORECASE)
        phones.extend(tel_matches)

        # Normalize and deduplicate
        normalized = []
        seen = set()

        for phone in phones:
            is_valid, norm_phone = cls.validate_phone(phone)
            if is_valid and norm_phone not in seen:
                normalized.append(norm_phone)
                seen.add(norm_phone)

        return normalized

    @classmethod
    def extract_whatsapp_from_html(cls, html: str) -> Optional[str]:
        """
        Extract WhatsApp number from HTML content.

        Args:
            html: HTML content to search

        Returns:
            WhatsApp number if found
        """
        # Look for wa.me links
        wa_pattern = r'wa\.me/(\d+)'
        matches = re.findall(wa_pattern, html)

        if matches:
            # Return first match, normalized
            return f"+{matches[0]}"

        # Look for WhatsApp API links
        api_pattern = r'api\.whatsapp\.com/send\?phone=(\d+)'
        api_matches = re.findall(api_pattern, html)

        if api_matches:
            return f"+{api_matches[0]}"

        return None

    @classmethod
    async def extract_contact_from_website(cls, url: str) -> dict:
        """
        Extract all contact information from a website.

        Args:
            url: Website URL

        Returns:
            Dict with extracted contact info
        """
        result = {
            "emails": [],
            "phones": [],
            "whatsapp": None,
            "primary_email": None,
            "primary_phone": None,
        }

        try:
            async with httpx.AsyncClient(
                timeout=15.0,
                follow_redirects=True,
                verify=False,
            ) as client:
                response = await client.get(url)
                html = response.text

                # Extract emails
                result["emails"] = cls.extract_emails_from_html(html)
                if result["emails"]:
                    # Prefer non-generic emails
                    for email in result["emails"]:
                        if not cls.is_generic_email(email):
                            result["primary_email"] = email
                            break
                    if not result["primary_email"]:
                        result["primary_email"] = result["emails"][0]

                # Extract phones
                result["phones"] = cls.extract_phones_from_html(html)
                if result["phones"]:
                    result["primary_phone"] = result["phones"][0]

                # Extract WhatsApp
                result["whatsapp"] = cls.extract_whatsapp_from_html(html)

                # Also check contact page if exists
                soup = BeautifulSoup(html, "lxml")
                contact_links = soup.find_all("a", href=re.compile(r"contact|contacto", re.I))

                for link in contact_links[:2]:  # Check max 2 contact pages
                    try:
                        contact_url = link["href"]
                        if not contact_url.startswith("http"):
                            contact_url = url.rstrip("/") + "/" + contact_url.lstrip("/")

                        contact_response = await client.get(contact_url)
                        contact_html = contact_response.text

                        # Add any new emails/phones found
                        new_emails = cls.extract_emails_from_html(contact_html)
                        for email in new_emails:
                            if email not in result["emails"]:
                                result["emails"].append(email)

                        new_phones = cls.extract_phones_from_html(contact_html)
                        for phone in new_phones:
                            if phone not in result["phones"]:
                                result["phones"].append(phone)

                        # Check for WhatsApp if not found yet
                        if not result["whatsapp"]:
                            result["whatsapp"] = cls.extract_whatsapp_from_html(contact_html)

                    except Exception:
                        continue

        except Exception as e:
            result["error"] = str(e)

        return result
