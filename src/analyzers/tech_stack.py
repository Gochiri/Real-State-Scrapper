import re
import asyncio
from typing import Dict, Any, Optional, List
from urllib.parse import urlparse
import httpx
from bs4 import BeautifulSoup


# Chat widget providers and their detection patterns
CHAT_PROVIDERS = {
    "tidio": ["tidio", "tidiochat"],
    "drift": ["drift.com", "js.driftt.com"],
    "intercom": ["intercom", "intercomcdn"],
    "zendesk": ["zendesk", "zdassets"],
    "crisp": ["crisp.chat", "client.crisp.chat"],
    "livechat": ["livechatinc", "livechat"],
    "hubspot": ["js.hs-scripts", "hubspot"],
    "freshchat": ["freshchat", "wchat.freshchat"],
    "tawk": ["tawk.to", "embed.tawk.to"],
    "olark": ["olark"],
    "purechat": ["purechat"],
    "smartsupp": ["smartsupp"],
    "jivochat": ["jivo", "jivosite"],
    "chatra": ["chatra"],
    "cliengo": ["cliengo"],  # Popular in Argentina
}

# CRM form patterns
CRM_PATTERNS = {
    "hubspot": ["hs-form", "hsforms", "hubspot"],
    "salesforce": ["salesforce", "pardot"],
    "zoho": ["zoho.com/crm", "zohocrm"],
    "pipedrive": ["pipedrive"],
    "activecampaign": ["activecampaign"],
    "mailchimp": ["mailchimp", "mc-embedded"],
    "tokko": ["tokkobroker", "tokko"],  # Popular in Argentina real estate
    "properati": ["properati"],
    "navent": ["navent"],
}


class TechStackAnalyzer:
    """Analyzes websites to detect their technology stack"""

    def __init__(self, timeout: float = 15.0):
        self.timeout = timeout
        self.headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
            "Accept-Language": "es-AR,es;q=0.9,en;q=0.8",
        }

    async def analyze(self, url: str) -> Dict[str, Any]:
        """
        Analyze a website and return tech stack information

        Args:
            url: Website URL to analyze

        Returns:
            Dict with detection results
        """
        result = {
            "has_website": True,
            "has_ssl": False,
            "has_chat_widget": False,
            "chat_provider": None,
            "has_contact_form": False,
            "has_whatsapp_button": False,
            "has_facebook": False,
            "facebook_url": None,
            "has_instagram": False,
            "instagram_url": None,
            "has_linkedin": False,
            "linkedin_url": None,
            "has_google_analytics": False,
            "has_google_tag_manager": False,
            "has_facebook_pixel": False,
            "has_crm_forms": False,
            "crm_provider": None,
            "has_blog": False,
            "detection_details": {},
        }

        # Normalize URL
        if not url.startswith(("http://", "https://")):
            url = "https://" + url

        try:
            async with httpx.AsyncClient(
                timeout=self.timeout,
                follow_redirects=True,
                verify=False,  # Some sites have invalid certs
            ) as client:
                # Check SSL
                parsed = urlparse(url)
                result["has_ssl"] = parsed.scheme == "https" or await self._check_ssl(url, client)

                # Fetch page
                response = await client.get(url, headers=self.headers)
                response.raise_for_status()

                html = response.text
                soup = BeautifulSoup(html, "lxml")

                # Run all detections
                result.update(await self._detect_all(html, soup, url, client))

        except httpx.HTTPError as e:
            result["has_website"] = False
            result["detection_details"]["error"] = str(e)
        except Exception as e:
            result["detection_details"]["error"] = str(e)

        return result

    async def _check_ssl(self, url: str, client: httpx.AsyncClient) -> bool:
        """Check if site supports HTTPS"""
        try:
            https_url = url.replace("http://", "https://")
            await client.head(https_url, headers=self.headers)
            return True
        except Exception:
            return False

    async def _detect_all(
        self,
        html: str,
        soup: BeautifulSoup,
        base_url: str,
        client: httpx.AsyncClient,
    ) -> Dict[str, Any]:
        """Run all detection methods"""
        results = {}

        # Chat widget detection
        chat_result = self._detect_chat_widget(html)
        results["has_chat_widget"] = chat_result["found"]
        results["chat_provider"] = chat_result["provider"]

        # WhatsApp detection
        results["has_whatsapp_button"] = self._detect_whatsapp(html, soup)

        # Contact form detection
        results["has_contact_form"] = self._detect_contact_form(soup)

        # Social media detection
        social = self._detect_social_media(soup, html)
        results.update(social)

        # Analytics detection
        analytics = self._detect_analytics(html)
        results.update(analytics)

        # CRM detection
        crm_result = self._detect_crm(html, soup)
        results["has_crm_forms"] = crm_result["found"]
        results["crm_provider"] = crm_result["provider"]

        # Blog detection
        results["has_blog"] = self._detect_blog(soup, html)

        return results

    def _detect_chat_widget(self, html: str) -> Dict[str, Any]:
        """Detect chat widget presence and provider"""
        html_lower = html.lower()

        for provider, patterns in CHAT_PROVIDERS.items():
            for pattern in patterns:
                if pattern.lower() in html_lower:
                    return {"found": True, "provider": provider}

        return {"found": False, "provider": None}

    def _detect_whatsapp(self, html: str, soup: BeautifulSoup) -> bool:
        """Detect WhatsApp button/link"""
        # Check for wa.me links
        if re.search(r"wa\.me|api\.whatsapp\.com|whatsapp:", html, re.I):
            return True

        # Check for WhatsApp icons/buttons
        whatsapp_patterns = [
            "whatsapp",
            "wa-button",
            "whatsapp-button",
            "btn-whatsapp",
            "fab fa-whatsapp",
            "icon-whatsapp",
        ]

        for pattern in whatsapp_patterns:
            if pattern in html.lower():
                return True

        # Check links with phone numbers in WhatsApp format
        for link in soup.find_all("a", href=True):
            href = link["href"].lower()
            if "whatsapp" in href or "wa.me" in href:
                return True

        return False

    def _detect_contact_form(self, soup: BeautifulSoup) -> bool:
        """Detect contact forms"""
        forms = soup.find_all("form")

        for form in forms:
            form_str = str(form).lower()
            # Look for contact-related forms
            contact_indicators = [
                "contact",
                "contacto",
                "consulta",
                "mensaje",
                "email",
                "telefono",
                "nombre",
                "submit",
                "enviar",
            ]
            if any(indicator in form_str for indicator in contact_indicators):
                return True

        return len(forms) > 0

    def _detect_social_media(self, soup: BeautifulSoup, html: str) -> Dict[str, Any]:
        """Detect social media presence"""
        result = {
            "has_facebook": False,
            "facebook_url": None,
            "has_instagram": False,
            "instagram_url": None,
            "has_linkedin": False,
            "linkedin_url": None,
        }

        # Find all links
        links = soup.find_all("a", href=True)

        for link in links:
            href = link["href"]

            # Facebook
            if "facebook.com" in href and "/share" not in href:
                result["has_facebook"] = True
                if "/pages/" in href or not href.endswith("facebook.com"):
                    result["facebook_url"] = href

            # Instagram
            if "instagram.com" in href:
                result["has_instagram"] = True
                result["instagram_url"] = href

            # LinkedIn
            if "linkedin.com" in href:
                result["has_linkedin"] = True
                result["linkedin_url"] = href

        # Also check meta tags for social
        og_facebook = soup.find("meta", property="fb:page_id")
        if og_facebook:
            result["has_facebook"] = True

        return result

    def _detect_analytics(self, html: str) -> Dict[str, Any]:
        """Detect analytics and tracking scripts"""
        result = {
            "has_google_analytics": False,
            "has_google_tag_manager": False,
            "has_facebook_pixel": False,
        }

        # Google Analytics patterns
        ga_patterns = [
            "google-analytics.com/analytics.js",
            "googletagmanager.com/gtag/js",
            "gtag('config'",
            "ga('create'",
            "_gaq.push",
            "UA-",
            "G-",  # GA4
        ]
        for pattern in ga_patterns:
            if pattern in html:
                result["has_google_analytics"] = True
                break

        # Google Tag Manager
        gtm_patterns = [
            "googletagmanager.com/gtm.js",
            "GTM-",
        ]
        for pattern in gtm_patterns:
            if pattern in html:
                result["has_google_tag_manager"] = True
                break

        # Facebook Pixel
        fb_patterns = [
            "connect.facebook.net",
            "fbq('init'",
            "facebook.com/tr",
            "_fbq",
        ]
        for pattern in fb_patterns:
            if pattern in html:
                result["has_facebook_pixel"] = True
                break

        return result

    def _detect_crm(self, html: str, soup: BeautifulSoup) -> Dict[str, Any]:
        """Detect CRM integrations"""
        html_lower = html.lower()

        for provider, patterns in CRM_PATTERNS.items():
            for pattern in patterns:
                if pattern.lower() in html_lower:
                    return {"found": True, "provider": provider}

        return {"found": False, "provider": None}

    def _detect_blog(self, soup: BeautifulSoup, html: str) -> bool:
        """Detect if site has a blog section"""
        blog_patterns = [
            "/blog",
            "/noticias",
            "/articulos",
            "/news",
            "/novedades",
        ]

        # Check links
        for link in soup.find_all("a", href=True):
            href = link["href"].lower()
            if any(pattern in href for pattern in blog_patterns):
                return True

        # Check for blog-related content
        html_lower = html.lower()
        if "wp-content" in html_lower or "wordpress" in html_lower:
            return True

        return False


async def analyze_website(url: str) -> Dict[str, Any]:
    """Convenience function to analyze a website"""
    analyzer = TechStackAnalyzer()
    return await analyzer.analyze(url)
