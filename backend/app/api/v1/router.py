from fastapi import APIRouter

from app.api.v1.auth import router as auth_router
from app.api.v1.menus import router as menus_router
from app.api.v1.permissions import router as permissions_router
from app.api.v1.roles import router as roles_router
from app.api.v1.users import router as users_router
from app.api.v1 import complaint_categories, dashboard, enquiry_categories, complaints, enquiries, report, customers, ticket_notes, status_master


api_router = APIRouter()
api_router.include_router(auth_router)
api_router.include_router(users_router)
api_router.include_router(roles_router)
api_router.include_router(menus_router)
api_router.include_router(permissions_router)



api_router.include_router(complaint_categories.router)
api_router.include_router(enquiry_categories.router)
api_router.include_router(complaints.router)
api_router.include_router(enquiries.router)
api_router.include_router(dashboard.router)
api_router.include_router(report.router)
api_router.include_router(customers.router)
api_router.include_router(ticket_notes.router)
api_router.include_router(status_master.router)


