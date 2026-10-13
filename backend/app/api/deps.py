from collections.abc import Callable, Generator

from fastapi import Depends, Header, HTTPException, Query, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.security import TOKEN_TYPE_ACCESS, user_id_from_token
from app.db.session import get_session_factory
from app.models.user import User
from app.services import permission_service as perm_svc

ALLOWED_ROLES = {"admin", "officer"}
security = HTTPBearer(auto_error=False)


def get_db() -> Generator[Session, None, None]:
    session = get_session_factory()()
    try:
        yield session
    finally:
        session.close()


def get_bearer_token(
    credentials: HTTPAuthorizationCredentials | None = Depends(security),
) -> str:
    if credentials is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated",
            headers={"WWW-Authenticate": "Bearer"},
        )
    if not credentials.scheme or credentials.scheme.lower() != "bearer" or not credentials.credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
    token = credentials.credentials.strip()
    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return token


def get_current_user_id(
    db: Session = Depends(get_db),
    token: str = Depends(get_bearer_token),
) -> int:
    try:
        user_id = user_id_from_token(token, expected_type=TOKEN_TYPE_ACCESS)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials",
            headers={"WWW-Authenticate": "Bearer"},
        ) from None

    user = db.scalars(select(User).where(User.id == user_id, User.is_deleted == False)).first()  # noqa: E712
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
            headers={"WWW-Authenticate": "Bearer"},
        )
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is inactive",
        )
    if user.role not in ALLOWED_ROLES:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User is not authorized to login",
        )

    return user.id


def _normalize_access_page(page: str | None) -> str | None:
    if not page or not str(page).strip():
        return None
    return str(page).strip().lower().replace("-", "_")


def require_permission(
    menu_key: str,
    action: str = "can_view",
    *,
    view_via_pages: tuple[str, ...] = (),
) -> Callable:
    """
    Enforce menu permission. For read (can_view), optionally allow access when the
    client passes ?page= or X-Access-Page and the user can view that page
    (e.g. dashboard widgets may load funds/expenses data).
    """

    def dependency(
        db: Session = Depends(get_db),
        user_id: int = Depends(get_current_user_id),
        page: str | None = Query(None, description="UI page requesting data (e.g. dashboard)"),
        x_access_page: str | None = Header(None, alias="X-Access-Page"),
    ) -> int:
        if perm_svc.has_permission(db, user_id, menu_key, action):
            return user_id

        access_page = _normalize_access_page(page or x_access_page)
        if (
            action == "can_view"
            and access_page
            and access_page in view_via_pages
            and perm_svc.has_permission(db, user_id, access_page, "can_view")
        ):
            return user_id

        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"You do not have permission to {action.replace('can_', '')} {menu_key}.",
        )

    return dependency


def require_any_permission(menu_key: str, *actions: str) -> Callable:
    """Allow access if the user has any of the listed actions on the menu."""

    def dependency(
        db: Session = Depends(get_db),
        user_id: int = Depends(get_current_user_id),
    ) -> int:
        if any(perm_svc.has_permission(db, user_id, menu_key, a) for a in actions):
            return user_id
        labels = ", ".join(a.replace("can_", "") for a in actions)
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"You do not have permission ({labels}) for {menu_key}.",
        )

    return dependency
