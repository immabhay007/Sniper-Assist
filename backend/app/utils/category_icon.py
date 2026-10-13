"""Category icon names stored in expense_categories.category_icon (React Icons export names)."""

DEFAULT_CATEGORY_ICON = "HiOutlineDotsCircleHorizontal"

# Legacy short keys from earlier app versions
_LEGACY_ALIASES: dict[str, str] = {
    "petrol": "BiGasPump",
    "food": "HiOutlineCake",
    "rent": "HiOutlineOfficeBuilding",
    "home": "HiOutlineHome",
    "emi": "BiCalendar",
    "material": "BiBox",
    "shopping": "HiOutlineShoppingCart",
    "salary": "HiOutlineUser",
    "vendor": "HiOutlineTruck",
    "medical": "BiFirstAid",
    "utilities": "HiOutlineLightningBolt",
    "cash": "HiOutlineCash",
    "documents": "HiOutlineDocumentText",
    "phone": "HiOutlinePhone",
    "internet": "HiOutlineWifi",
    "gift": "HiOutlineGift",
    "education": "HiOutlineAcademicCap",
    "maintenance": "BiWrench",
    "cart": "BiCart",
    "rupee": "HiOutlineCurrencyRupee",
    "tasks": "HiOutlineClipboardList",
    "settings": "HiOutlineCog",
    "health": "HiOutlineHeart",
    "misc": "HiOutlineDotsCircleHorizontal",
}


def resolve_category_icon(value: str | None) -> str:
    raw = (value or "").strip()
    if not raw:
        return DEFAULT_CATEGORY_ICON
    if raw.startswith("Hi") or raw.startswith("Bi"):
        return raw
    return _LEGACY_ALIASES.get(raw.lower(), DEFAULT_CATEGORY_ICON)
