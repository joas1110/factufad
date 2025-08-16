# backend/auth.py
from typing import Optional, Iterable
from fastapi import Depends, Header, HTTPException
from firebase_admin import auth as fb_auth
from .firestore_client import get_db  # asegura init del Admin SDK

async def get_current_user(authorization: Optional[str] = Header(None)):
    """
    Valida el ID token de Firebase. Devuelve {uid, email} o 401.
    """
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Token faltante")

    id_token = authorization.split(" ", 1)[1]

    # Asegura inicialización de Firebase
    get_db()

    try:
        decoded = fb_auth.verify_id_token(id_token)
        return {"uid": decoded.get("uid"), "email": decoded.get("email")}
    except Exception:
        # Si quisieras loguear el error para debug:
        # import traceback; traceback.print_exc()
        raise HTTPException(status_code=401, detail="Token inválido")

def get_user_role(email: str) -> str:
    """
    Lee el rol del usuario en Firestore, colección 'users', campo 'email'.
    Si no existe, por defecto 'operator'.
    """
    db = get_db()
    try:
        q = db.collection("users").where("email", "==", email).limit(1).get()
        if q:
            doc = q[0].to_dict() or {}
            return doc.get("role", "operator")
    except Exception:
        # Si hay problema de permisos o conexión, degradamos a operador
        return "operator"
    return "operator"

def require_role(*allowed_roles: Iterable[str]):
    """
    Uso:
      - En parámetro: def ruta(user=Depends(require_role("admin"))): ...
      - O en dependencies=[Depends(require_role("admin"))]
    Verifica que el usuario tenga un rol permitido.
    """
    async def _dep(user=Depends(get_current_user)):
        role = get_user_role(user.get("email") or "")
        if allowed_roles and role not in allowed_roles:
            raise HTTPException(status_code=403, detail="Permisos insuficientes")
        return user
    return _dep
