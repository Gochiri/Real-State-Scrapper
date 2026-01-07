from typing import Optional, List, Dict, Any
import httpx
from src.config import get_settings
from src.models import Lead, TechStack
from src.analyzers.scoring import get_gap_summary, get_score_category

settings = get_settings()


class GoHighLevelClient:
    """Client for Go High Level API integration"""

    BASE_URL = "https://rest.gohighlevel.com/v1"

    def __init__(
        self,
        api_key: Optional[str] = None,
        location_id: Optional[str] = None,
        workflow_id: Optional[str] = None,
    ):
        self.api_key = api_key or settings.ghl_api_key
        self.location_id = location_id or settings.ghl_location_id
        self.workflow_id = workflow_id or settings.ghl_workflow_id

        if not self.api_key:
            raise ValueError("GHL_API_KEY is required")

        self.headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
        }

    async def create_contact(
        self,
        lead: Lead,
        tags: Optional[List[str]] = None,
        workflow_id: Optional[str] = None,
    ) -> Optional[str]:
        """
        Create a contact in Go High Level from a lead.

        Args:
            lead: Lead model instance
            tags: Additional tags to add
            workflow_id: Workflow to trigger (optional)

        Returns:
            GHL contact ID if successful, None otherwise
        """
        # Build contact payload
        payload = {
            "locationId": self.location_id,
            "firstName": self._extract_first_name(lead.name),
            "lastName": self._extract_last_name(lead.name),
            "name": lead.name,
            "email": lead.email,
            "phone": lead.phone,
            "address1": lead.address,
            "city": lead.city,
            "state": lead.province,
            "country": "Argentina",
            "website": lead.website,
            "tags": tags or [],
            "source": "Lead Scraper",
            "customField": {
                "opportunity_score": str(lead.opportunity_score),
                "gmb_url": lead.gmb_url or "",
                "rating": str(lead.rating) if lead.rating else "",
                "reviews_count": str(lead.reviews_count) if lead.reviews_count else "",
                "score_category": get_score_category(lead.opportunity_score),
            },
        }

        # Remove None values
        payload = {k: v for k, v in payload.items() if v is not None}

        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                # Create contact
                response = await client.post(
                    f"{self.BASE_URL}/contacts/",
                    json=payload,
                    headers=self.headers,
                )

                if response.status_code == 200:
                    contact_data = response.json()
                    contact_id = contact_data.get("contact", {}).get("id")

                    # Trigger workflow if specified
                    wf_id = workflow_id or self.workflow_id
                    if wf_id and contact_id:
                        await self._trigger_workflow(client, contact_id, wf_id)

                    return contact_id

                elif response.status_code == 409:
                    # Contact already exists, try to update
                    return await self._update_existing_contact(lead, tags)

                else:
                    print(f"GHL API Error: {response.status_code} - {response.text}")
                    return None

        except Exception as e:
            print(f"GHL API Exception: {e}")
            return None

    async def _update_existing_contact(
        self,
        lead: Lead,
        tags: Optional[List[str]] = None,
    ) -> Optional[str]:
        """Update an existing contact if it already exists"""
        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                # Search for existing contact
                search_params = {}
                if lead.email:
                    search_params["email"] = lead.email
                elif lead.phone:
                    search_params["phone"] = lead.phone

                if not search_params:
                    return None

                search_response = await client.get(
                    f"{self.BASE_URL}/contacts/lookup",
                    params={**search_params, "locationId": self.location_id},
                    headers=self.headers,
                )

                if search_response.status_code == 200:
                    contacts = search_response.json().get("contacts", [])
                    if contacts:
                        contact_id = contacts[0]["id"]

                        # Update with new tags
                        if tags:
                            await self._add_tags(client, contact_id, tags)

                        return contact_id

                return None

        except Exception as e:
            print(f"GHL Update Exception: {e}")
            return None

    async def _trigger_workflow(
        self,
        client: httpx.AsyncClient,
        contact_id: str,
        workflow_id: str,
    ) -> bool:
        """Trigger a workflow for a contact"""
        try:
            response = await client.post(
                f"{self.BASE_URL}/contacts/{contact_id}/workflow/{workflow_id}",
                headers=self.headers,
            )
            return response.status_code == 200
        except Exception:
            return False

    async def _add_tags(
        self,
        client: httpx.AsyncClient,
        contact_id: str,
        tags: List[str],
    ) -> bool:
        """Add tags to a contact"""
        try:
            response = await client.post(
                f"{self.BASE_URL}/contacts/{contact_id}/tags",
                json={"tags": tags},
                headers=self.headers,
            )
            return response.status_code == 200
        except Exception:
            return False

    def generate_gap_tags(self, tech_stack: TechStack) -> List[str]:
        """
        Generate tags based on technology gaps.

        Args:
            tech_stack: TechStack model instance

        Returns:
            List of gap tags
        """
        tags = []

        # Convert model to dict for gap analysis
        stack_dict = {
            "has_website": tech_stack.has_website,
            "has_ssl": tech_stack.has_ssl,
            "has_chat_widget": tech_stack.has_chat_widget,
            "has_whatsapp_button": tech_stack.has_whatsapp_button,
            "has_contact_form": tech_stack.has_contact_form,
            "has_facebook": tech_stack.has_facebook,
            "has_instagram": tech_stack.has_instagram,
            "has_linkedin": tech_stack.has_linkedin,
            "has_google_analytics": tech_stack.has_google_analytics,
            "has_facebook_pixel": tech_stack.has_facebook_pixel,
            "has_crm_forms": tech_stack.has_crm_forms,
            "has_blog": tech_stack.has_blog,
        }

        gap_summary = get_gap_summary(stack_dict)
        tags = gap_summary["gap_tags"]

        # Add score category tag
        # Note: You'd need to pass the score here or get it from lead
        return tags

    @staticmethod
    def _extract_first_name(full_name: str) -> str:
        """Extract first name from full name"""
        parts = full_name.strip().split()
        return parts[0] if parts else ""

    @staticmethod
    def _extract_last_name(full_name: str) -> str:
        """Extract last name from full name"""
        parts = full_name.strip().split()
        return " ".join(parts[1:]) if len(parts) > 1 else ""

    async def get_contacts(
        self,
        limit: int = 100,
        skip: int = 0,
    ) -> List[Dict[str, Any]]:
        """Get contacts from GHL"""
        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.get(
                    f"{self.BASE_URL}/contacts/",
                    params={
                        "locationId": self.location_id,
                        "limit": limit,
                        "skip": skip,
                    },
                    headers=self.headers,
                )

                if response.status_code == 200:
                    return response.json().get("contacts", [])

                return []

        except Exception as e:
            print(f"GHL Get Contacts Exception: {e}")
            return []

    async def delete_contact(self, contact_id: str) -> bool:
        """Delete a contact from GHL"""
        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.delete(
                    f"{self.BASE_URL}/contacts/{contact_id}",
                    headers=self.headers,
                )
                return response.status_code == 200

        except Exception:
            return False
