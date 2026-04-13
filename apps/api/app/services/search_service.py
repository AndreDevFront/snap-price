import re
import httpx
from app.core.config import settings

# Plataformas brasileiras de compra/venda mapeadas por domínio
PLATFORM_NAMES = {
    "mercadolivre.com.br": "Mercado Livre",
    "mercadolivre.com": "Mercado Livre",
    "olx.com.br": "OLX",
    "shopee.com.br": "Shopee",
    "amazon.com.br": "Amazon",
    "enjoei.com.br": "Enjoei",
    "estantevirtual.com.br": "Estante Virtual",
    "webmotors.com.br": "Webmotors",
    "icarros.com.br": "iCarros",
    "zapimoveis.com.br": "ZAP Imóveis",
    "vivareal.com.br": "Viva Real",
    "quintoandar.com.br": "Quinto Andar",
    "americanas.com.br": "Americanas",
    "submarino.com.br": "Submarino",
    "casasbahia.com.br": "Casas Bahia",
    "magazineluiza.com.br": "Magazine Luiza",
    "netshoes.com.br": "Netshoes",
    "zattini.com.br": "Zattini",
    "dafiti.com.br": "Dafiti",
    "leroy.com.br": "Leroy Merlin",
    "leroymerlin.com.br": "Leroy Merlin",
    "facebook.com": "Facebook Marketplace",
}

PRICE_RE = re.compile(r"R\$\s*([\d.,]+)")


def _extract_price(text: str) -> float | None:
    """Extrai o primeiro preço encontrado em BRL de um texto."""
    match = PRICE_RE.search(text)
    if not match:
        return None
    raw = match.group(1).replace(".", "").replace(",", ".")
    try:
        return float(raw)
    except ValueError:
        return None


def _platform_from_url(url: str) -> str | None:
    """Retorna o nome da plataforma a partir da URL, ou None se desconhecida."""
    for domain, name in PLATFORM_NAMES.items():
        if domain in url:
            return name
    return None


async def search_real_prices(product_name: str) -> list[dict]:
    """
    Busca preços reais do produto no Google Custom Search.
    Retorna lista de dicts com name, price, url (máx 4 plataformas únicas).
    Se GOOGLE_API_KEY ou GOOGLE_CSE_ID não estiverem configurados, retorna [].
    """
    api_key = getattr(settings, "GOOGLE_API_KEY", None)
    cse_id = getattr(settings, "GOOGLE_CSE_ID", None)
    if not api_key or not cse_id:
        return []

    query = f"{product_name} preço site:mercadolivre.com.br OR site:olx.com.br OR site:shopee.com.br OR site:amazon.com.br OR site:enjoei.com.br OR site:americanas.com.br"

    try:
        async with httpx.AsyncClient(timeout=8) as client:
            resp = await client.get(
                "https://www.googleapis.com/customsearch/v1",
                params={
                    "key": api_key,
                    "cx": cse_id,
                    "q": query,
                    "num": 10,
                    "gl": "br",
                    "hl": "pt",
                },
            )
            resp.raise_for_status()
            data = resp.json()
    except Exception:
        return []

    results: list[dict] = []
    seen_platforms: set[str] = set()

    for item in data.get("items", []):
        url = item.get("link", "")
        platform = _platform_from_url(url)
        if not platform or platform in seen_platforms:
            continue

        # Tenta extrair preço do snippet ou título
        snippet = item.get("snippet", "") + " " + item.get("title", "")
        price = _extract_price(snippet)
        if price is None:
            continue

        results.append({"name": platform, "price": price, "url": url})
        seen_platforms.add(platform)

        if len(results) == 4:
            break

    return results
