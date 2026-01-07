import asyncio
from typing import List, Dict, Any, Optional
from serpapi import GoogleSearch
from src.scrapers.base import BaseScraper
from src.config import get_settings

settings = get_settings()

# Argentine cities with coordinates for better search
ARGENTINA_CITIES = {
    "Buenos Aires": {"lat": -34.6037, "lng": -58.3816, "province": "CABA"},
    "CABA": {"lat": -34.6037, "lng": -58.3816, "province": "CABA"},
    "Cordoba": {"lat": -31.4201, "lng": -64.1888, "province": "Córdoba"},
    "Rosario": {"lat": -32.9442, "lng": -60.6505, "province": "Santa Fe"},
    "Mendoza": {"lat": -32.8895, "lng": -68.8458, "province": "Mendoza"},
    "San Miguel de Tucuman": {"lat": -26.8083, "lng": -65.2176, "province": "Tucumán"},
    "La Plata": {"lat": -34.9205, "lng": -57.9536, "province": "Buenos Aires"},
    "Mar del Plata": {"lat": -38.0023, "lng": -57.5575, "province": "Buenos Aires"},
    "Salta": {"lat": -24.7821, "lng": -65.4232, "province": "Salta"},
    "Santa Fe": {"lat": -31.6333, "lng": -60.7000, "province": "Santa Fe"},
    "San Juan": {"lat": -31.5375, "lng": -68.5364, "province": "San Juan"},
    "Neuquen": {"lat": -38.9516, "lng": -68.0591, "province": "Neuquén"},
    "Bahia Blanca": {"lat": -38.7196, "lng": -62.2724, "province": "Buenos Aires"},
    "Resistencia": {"lat": -27.4606, "lng": -58.9839, "province": "Chaco"},
    "Posadas": {"lat": -27.3671, "lng": -55.8961, "province": "Misiones"},
    "San Salvador de Jujuy": {"lat": -24.1858, "lng": -65.2995, "province": "Jujuy"},
    "Parana": {"lat": -31.7413, "lng": -60.5115, "province": "Entre Ríos"},
    "Formosa": {"lat": -26.1775, "lng": -58.1781, "province": "Formosa"},
    "San Luis": {"lat": -33.3017, "lng": -66.3378, "province": "San Luis"},
    "Santiago del Estero": {"lat": -27.7951, "lng": -64.2615, "province": "Santiago del Estero"},
    "Catamarca": {"lat": -28.4696, "lng": -65.7852, "province": "Catamarca"},
    "La Rioja": {"lat": -29.4131, "lng": -66.8558, "province": "La Rioja"},
    "Rio Gallegos": {"lat": -51.6230, "lng": -69.2168, "province": "Santa Cruz"},
    "Ushuaia": {"lat": -54.8019, "lng": -68.3030, "province": "Tierra del Fuego"},
    "Rawson": {"lat": -43.3002, "lng": -65.1023, "province": "Chubut"},
    "Viedma": {"lat": -40.8135, "lng": -62.9967, "province": "Río Negro"},
    "Santa Rosa": {"lat": -36.6167, "lng": -64.2833, "province": "La Pampa"},
}

REAL_ESTATE_KEYWORDS = [
    "inmobiliaria",
    "bienes raices",
    "real estate",
    "propiedades",
    "agencia inmobiliaria",
]


class SerpApiMapsScraper(BaseScraper):
    """Scraper using SerpAPI for Google Maps local results"""

    def __init__(self, api_key: Optional[str] = None):
        self.api_key = api_key or settings.serpapi_key
        if not self.api_key:
            raise ValueError("SERPAPI_KEY is required")

    async def search(
        self,
        keyword: str,
        city: str,
        limit: int = 20,
        **kwargs
    ) -> List[Dict[str, Any]]:
        """
        Search for real estate businesses in a city using SerpAPI

        Args:
            keyword: Search term (e.g., "inmobiliaria")
            city: City name in Argentina
            limit: Max results to return

        Returns:
            List of parsed business results
        """
        city_data = ARGENTINA_CITIES.get(city)
        if city_data:
            query = f"{keyword} {city} Argentina"
            ll = f"@{city_data['lat']},{city_data['lng']},14z"
        else:
            query = f"{keyword} {city} Argentina"
            ll = None

        params = {
            "engine": "google_maps",
            "q": query,
            "type": "search",
            "api_key": self.api_key,
            "hl": "es",
            "gl": "ar",
        }

        if ll:
            params["ll"] = ll

        # Run sync API call in executor to not block
        loop = asyncio.get_event_loop()
        results = await loop.run_in_executor(None, self._search_sync, params)

        parsed_results = []
        local_results = results.get("local_results", [])

        for idx, result in enumerate(local_results[:limit]):
            parsed = self.parse_result(result)
            parsed["city"] = city
            parsed["province"] = city_data["province"] if city_data else None
            parsed_results.append(parsed)

        return parsed_results

    def _search_sync(self, params: Dict) -> Dict:
        """Synchronous search call"""
        search = GoogleSearch(params)
        return search.get_dict()

    def parse_result(self, raw_data: Dict[str, Any]) -> Dict[str, Any]:
        """Parse SerpAPI Google Maps result into standardized format"""
        return {
            "name": raw_data.get("title", ""),
            "address": raw_data.get("address", ""),
            "phone": raw_data.get("phone", ""),
            "website": raw_data.get("website"),
            "gmb_url": raw_data.get("place_id_search"),
            "place_id": raw_data.get("place_id"),
            "rating": raw_data.get("rating"),
            "reviews_count": raw_data.get("reviews"),
            "photos_count": raw_data.get("photos_count"),
            "type": raw_data.get("type"),
            "hours": raw_data.get("hours"),
            "gps_coordinates": raw_data.get("gps_coordinates"),
            "thumbnail": raw_data.get("thumbnail"),
        }

    async def search_all_keywords(
        self,
        city: str,
        keywords: Optional[List[str]] = None,
        limit_per_keyword: int = 20,
    ) -> List[Dict[str, Any]]:
        """
        Search with all real estate keywords and deduplicate by place_id

        Args:
            city: City to search in
            keywords: List of search terms (defaults to REAL_ESTATE_KEYWORDS)
            limit_per_keyword: Max results per keyword

        Returns:
            Deduplicated list of businesses
        """
        keywords = keywords or REAL_ESTATE_KEYWORDS
        all_results = {}

        for keyword in keywords:
            try:
                results = await self.search(keyword, city, limit=limit_per_keyword)
                for result in results:
                    place_id = result.get("place_id")
                    if place_id and place_id not in all_results:
                        all_results[place_id] = result
            except Exception as e:
                print(f"Error searching '{keyword}' in {city}: {e}")
                continue

        return list(all_results.values())


def get_available_cities() -> List[str]:
    """Return list of available Argentine cities"""
    return list(ARGENTINA_CITIES.keys())
