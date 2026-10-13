"""
Canonical list of app menus — must match sidebar routes in the webapp.
New entries are added here first, then registered in the DB via the Menus admin page.
"""

from typing import TypedDict


class CatalogMenu(TypedDict):
    menu_key: str
    menu_name: str
    route: str
    group: str
    sort_order: int


AVAILABLE_MENUS: list[CatalogMenu] = [
    {"menu_key": "dashboard", "menu_name": "Dashboard", "route": "/dashboard", "group": "Overview", "sort_order": 1},
    {"menu_key": "categories", "menu_name": "Categories", "route": "/categories", "group": "Settings", "sort_order": 8},
    {"menu_key": "users", "menu_name": "Team", "route": "/users", "group": "Settings", "sort_order": 9},
    {"menu_key": "roles", "menu_name": "Roles", "route": "/roles", "group": "Settings", "sort_order": 10},
    {"menu_key": "menus", "menu_name": "Menus", "route": "/menus", "group": "Settings", "sort_order": 11},
    {"menu_key": "settings", "menu_name": "Settings", "route": "/settings", "group": "Settings", "sort_order": 12},
]

CATALOG_BY_KEY = {m["menu_key"]: m for m in AVAILABLE_MENUS}


def get_catalog_entry(menu_key: str) -> CatalogMenu | None:
    return CATALOG_BY_KEY.get(menu_key)
