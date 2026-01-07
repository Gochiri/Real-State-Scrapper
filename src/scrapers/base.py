from abc import ABC, abstractmethod
from typing import List, Dict, Any


class BaseScraper(ABC):
    """Base class for all scrapers"""

    @abstractmethod
    async def search(self, keyword: str, city: str, **kwargs) -> List[Dict[str, Any]]:
        """Search for businesses and return raw results"""
        pass

    @abstractmethod
    def parse_result(self, raw_data: Dict[str, Any]) -> Dict[str, Any]:
        """Parse raw API/scrape result into standardized format"""
        pass
