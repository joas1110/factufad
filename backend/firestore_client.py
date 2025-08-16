# backend/firestore_client.py
import os, json
import firebase_admin
from firebase_admin import credentials, firestore

_app = None
_db = None

def _init():
    global _app, _db
    if _app:
        return

    # 1) Si hay JSON en env, usarlo (Render)
    sa_json = os.getenv("GOOGLE_APPLICATION_CREDENTIALS_JSON")
    if sa_json:
        if sa_json.strip().startswith("{"):
            cred = credentials.Certificate(json.loads(sa_json))
        else:
            # también soporta ruta si la env tiene un path
            cred = credentials.Certificate(sa_json)
        _app = firebase_admin.initialize_app(cred)
    else:
        # 2) Fallback: archivo local (desarrollo)
        here = os.path.dirname(__file__)
        cred_path = os.path.join(here, "serviceAccount.json")
        cred = credentials.Certificate(cred_path)
        _app = firebase_admin.initialize_app(cred)

    _db = firestore.client()
    print("[Firebase] Admin SDK listo")

def get_db():
    _init()
    return _db
