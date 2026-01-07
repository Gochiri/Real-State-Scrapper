from typing import Dict, Any
from src.config import get_settings


def calculate_opportunity_score(tech_stack: Dict[str, Any]) -> int:
    """
    Calculate opportunity score based on technology gaps.

    Higher score = more gaps = better opportunity to sell CRM.
    Score ranges from 0 (has everything) to 100 (has nothing).

    Args:
        tech_stack: Dict with boolean flags for each tech element

    Returns:
        Opportunity score (0-100)
    """
    settings = get_settings()

    # Start with max score (100 = has nothing, maximum opportunity)
    max_score = 100
    current_score = max_score

    # Subtract points for each technology they HAVE
    # (less opportunity if they already have it)

    if tech_stack.get("has_website", False):
        current_score -= settings.score_weight_website

    if tech_stack.get("has_ssl", False):
        current_score -= settings.score_weight_ssl

    if tech_stack.get("has_chat_widget", False):
        current_score -= settings.score_weight_chat

    if tech_stack.get("has_whatsapp_button", False):
        current_score -= settings.score_weight_whatsapp

    if tech_stack.get("has_contact_form", False):
        current_score -= settings.score_weight_form

    if tech_stack.get("has_facebook", False):
        current_score -= settings.score_weight_facebook

    if tech_stack.get("has_instagram", False):
        current_score -= settings.score_weight_instagram

    if tech_stack.get("has_linkedin", False):
        current_score -= settings.score_weight_linkedin

    if tech_stack.get("has_google_analytics", False):
        current_score -= settings.score_weight_analytics

    if tech_stack.get("has_facebook_pixel", False):
        current_score -= settings.score_weight_pixel

    # Ensure score is within bounds
    return max(0, min(100, current_score))


def get_gap_summary(tech_stack: Dict[str, Any]) -> Dict[str, Any]:
    """
    Get a summary of technology gaps for a lead.

    Args:
        tech_stack: Dict with boolean flags for each tech element

    Returns:
        Dict with gap analysis
    """
    gaps = []
    has = []

    checks = [
        ("has_website", "Website propio", "sin-web"),
        ("has_ssl", "Certificado SSL", "sin-ssl"),
        ("has_chat_widget", "Chat widget", "sin-chat"),
        ("has_whatsapp_button", "Botón WhatsApp", "sin-whatsapp"),
        ("has_contact_form", "Formulario de contacto", "sin-form"),
        ("has_facebook", "Página de Facebook", "sin-facebook"),
        ("has_instagram", "Cuenta Instagram", "sin-instagram"),
        ("has_linkedin", "Perfil LinkedIn", "sin-linkedin"),
        ("has_google_analytics", "Google Analytics", "sin-analytics"),
        ("has_facebook_pixel", "Facebook Pixel", "sin-pixel"),
        ("has_crm_forms", "CRM integrado", "sin-crm"),
        ("has_blog", "Blog/Contenido", "sin-blog"),
    ]

    for key, label, tag in checks:
        if tech_stack.get(key, False):
            has.append({"label": label, "key": key})
        else:
            gaps.append({"label": label, "key": key, "tag": tag})

    return {
        "gaps": gaps,
        "has": has,
        "gap_count": len(gaps),
        "has_count": len(has),
        "gap_tags": [g["tag"] for g in gaps],
    }


def get_score_category(score: int) -> str:
    """
    Get human-readable category for a score.

    Args:
        score: Opportunity score (0-100)

    Returns:
        Category string
    """
    if score >= 80:
        return "hot"  # High opportunity
    elif score >= 60:
        return "warm"
    elif score >= 40:
        return "medium"
    elif score >= 20:
        return "cool"
    else:
        return "cold"  # Low opportunity (they have most things)


def get_score_label(score: int) -> str:
    """Get display label for score category"""
    categories = {
        "hot": "🔥 Alta Oportunidad",
        "warm": "🌡️ Buena Oportunidad",
        "medium": "📊 Oportunidad Media",
        "cool": "❄️ Oportunidad Baja",
        "cold": "🧊 Ya tienen casi todo",
    }
    return categories.get(get_score_category(score), "Unknown")
