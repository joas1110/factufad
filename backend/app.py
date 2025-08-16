from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from typing import List
from datetime import datetime
import io, zipfile
import pandas as pd
from reportlab.pdfgen import canvas
from google.cloud import firestore  # Needed for order_by directions

from backend.firestore_client import get_db
from typing import Optional
from .auth import get_current_user, require_role
from .models import Product, Sale, Purchase, Expense
from .utils import period_bounds

import os


app = FastAPI(title="Factufad API", version="0.1.0")

origins = [o.strip() for o in os.getenv("ALLOWED_ORIGINS", "*").split(",")]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
@app.get("/")
def root():
    return {"message": "API funcionando correctamente"}

@app.get("/health")
def health():
    return {"status": "ok"}

# ====== USERS (ADMIN) ======
@app.get("/auth/me")
def me(user = Depends(get_current_user)):
    return user

@app.post("/admin/users/{uid}/role/{role}")
def set_role(uid: str, role: str, _ = Depends(require_role("admin"))):
    if role not in ("admin", "operator"):
        raise HTTPException(400, "Rol inválido")
    db = get_db()
    db.collection('users').document(uid).set({"role": role}, merge=True)
    return {"uid": uid, "role": role}

# ====== PRODUCTS ======
@app.get("/products", response_model=List[Product])
def list_products(_ = Depends(get_current_user)):
    db = get_db()
    docs = db.collection('products').order_by('name').stream()
    out = []
    for d in docs:
        obj = d.to_dict(); obj['id'] = d.id
        out.append(obj)
    return out

@app.post("/products", response_model=Product)
def create_product(p: Product, user = Depends(require_role("admin"))):
    db = get_db()
    p.createdAt = datetime.utcnow()
    doc = db.collection('products').document()
    doc.set(p.model_dump(exclude={'id'}))
    p.id = doc.id
    return p

@app.put("/products/{pid}", response_model=Product)
def update_product(pid: str, p: Product, _ = Depends(require_role("admin"))):
    db = get_db()
    ref = db.collection('products').document(pid)
    if not ref.get().exists:
        raise HTTPException(404, "Producto no encontrado")
    data = p.model_dump(exclude={'id'})
    ref.update(data)
    data['id'] = pid
    return data

@app.delete("/products/{pid}")
def delete_product(pid: str, _ = Depends(require_role("admin"))):
    db = get_db()
    ref = db.collection('products').document(pid)
    if not ref.get().exists:
        raise HTTPException(404, "Producto no encontrado")
    ref.delete()
    return {"status": "deleted"}

# ====== SALES ======
@app.post("/sales", response_model=Sale)
def create_sale(sale: Sale, user = Depends(get_current_user)):
    db = get_db()
    sale.createdAt = datetime.utcnow()
    sale.createdBy = user['uid']

    total = sum(item.subtotal for item in sale.items)
    gross = sum((item.unitPrice - item.unitCost) * item.quantity for item in sale.items)
    sale.total = total
    sale.grossProfit = gross

    def txn_op(transaction):
        for it in sale.items:
            pref = db.collection('products').document(it.productId)
            psnap = pref.get(transaction=transaction)
            if not psnap.exists:
                raise HTTPException(400, f"Producto {it.productId} no existe")
            pdata = psnap.to_dict()
            new_stock = int(pdata.get('stock', 0)) - int(it.quantity)
            if new_stock < 0:
                raise HTTPException(400, f"Stock insuficiente: {pdata.get('name')}")
            transaction.update(pref, {"stock": new_stock})

    db.transaction()(txn_op)()

    ref = db.collection('sales').document()
    ref.set(sale.model_dump(exclude={'id'}))
    sale.id = ref.id
    return sale

@app.get("/sales")
def list_sales(period: str = None, date_from: str = None, date_to: str = None, _ = Depends(get_current_user)):
    db = get_db()
    q = db.collection('sales')
    if period:
        start, end = period_bounds(period, date_from, date_to)
        q = q.where('date', '>=', start).where('date', '<=', end)
    q = q.order_by('date', direction=firestore.Query.DESCENDING)
    docs = q.stream()
    out = []
    for d in docs:
        obj = d.to_dict(); obj['id'] = d.id
        out.append(obj)
    return out

# ====== PURCHASES ======
@app.post("/purchases", response_model=Purchase)
def create_purchase(p: Purchase, user = Depends(get_current_user)):
    db = get_db()
    p.createdAt = datetime.utcnow()
    p.createdBy = user['uid']
    p.total = sum(i.subtotal for i in p.items)

    def txn_op(transaction):
        for it in p.items:
            pref = db.collection('products').document(it.productId)
            psnap = pref.get(transaction=transaction)
            if not psnap.exists:
                raise HTTPException(400, f"Producto {it.productId} no existe")
            pdata = psnap.to_dict()
            new_stock = int(pdata.get('stock', 0)) + int(it.quantity)
            transaction.update(pref, {"stock": new_stock, "cost": it.unitCost})

    db.transaction()(txn_op)()

    ref = db.collection('purchases').document()
    ref.set(p.model_dump(exclude={'id'}))
    p.id = ref.id
    return p

@app.get("/purchases")
def list_purchases(_ = Depends(get_current_user)):
    db = get_db()
    docs = db.collection('purchases').order_by('date', direction=firestore.Query.DESCENDING).stream()
    out = []
    for d in docs:
        obj = d.to_dict(); obj['id'] = d.id
        out.append(obj)
    return out

# ====== EXPENSES ======
@app.post("/expenses", response_model=Expense)
def create_expense(e: Expense, user = Depends(get_current_user)):
    db = get_db()
    e.createdAt = datetime.utcnow()
    e.createdBy = user['uid']
    ref = db.collection('expenses').document()
    ref.set(e.model_dump(exclude={'id'}))
    e.id = ref.id
    return e

@app.get("/expenses")
def list_expenses(_ = Depends(get_current_user)):
    db = get_db()
    docs = db.collection('expenses').order_by('date', direction=firestore.Query.DESCENDING).stream()
    out = []
    for d in docs:
        obj = d.to_dict(); obj['id'] = d.id
        out.append(obj)
    return out

# ====== INVENTORY HELPERS ======
@app.get("/inventory/low-stock")
def low_stock(_ = Depends(get_current_user)):
    db = get_db()
    docs = db.collection('products').stream()
    out = []
    for d in docs:
        pdata = d.to_dict()
        if pdata.get('minStock', 0) > 0 and pdata.get('stock', 0) <= pdata.get('minStock'):
            pdata['id'] = d.id
            out.append(pdata)
    return out

# ====== REPORTES ======
@app.get("/reports/summary")
def report_summary(period: str = 'monthly', date_from: str = None, date_to: str = None, _ = Depends(get_current_user)):
    db = get_db()
    start, end = period_bounds(period, date_from, date_to)

    sales_docs = db.collection('sales').where('date', '>=', start).where('date', '<=', end).stream()
    ventas, cogs = 0.0, 0.0
    for d in sales_docs:
        s = d.to_dict()
        ventas += float(s.get('total', 0))
        for it in s.get('items', []):
            cogs += float(it.get('unitCost', 0)) * float(it.get('quantity', 0))
    ganancia_bruta = ventas - cogs

    exp_docs = db.collection('expenses').where('date', '>=', start).where('date', '<=', end).stream()
    gastos = sum(float(e.to_dict().get('amount', 0)) for e in exp_docs)

    ganancia_neta = ganancia_bruta - gastos
    return {
        "ventas": ventas,
        "costo_ventas": cogs,
        "gastos": gastos,
        "ganancia_bruta": ganancia_bruta,
        "ganancia_neta": ganancia_neta
    }

# ====== EXPORTS ======
@app.get("/export/excel")
def export_excel(_ = Depends(get_current_user)):
    db = get_db()
    def coll_to_df(name):
        rows = []
        for d in db.collection(name).stream():
            r = d.to_dict(); r['id'] = d.id
            rows.append(r)
        return pd.DataFrame(rows)

    with pd.ExcelWriter("/tmp/factufad_export.xlsx") as writer:
        for name in ["products", "sales", "purchases", "expenses", "users"]:
            df = coll_to_df(name)
            df.to_excel(writer, sheet_name=name, index=False)

    with open("/tmp/factufad_export.xlsx", "rb") as f:
        data = f.read()
    from fastapi.responses import Response
    return Response(content=data, media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                    headers={"Content-Disposition": "attachment; filename=factufad_export.xlsx"})

@app.get("/export/csv")
def export_csv(_ = Depends(get_current_user)):
    db = get_db()
    zbuf = io.BytesIO()
    with zipfile.ZipFile(zbuf, 'w', zipfile.ZIP_DEFLATED) as z:
        for name in ["products", "sales", "purchases", "expenses", "users"]:
            rows = []
            for d in db.collection(name).stream():
                r = d.to_dict(); r['id'] = d.id
                rows.append(r)
            df = pd.DataFrame(rows)
            z.writestr(f"{name}.csv", df.to_csv(index=False))
    zbuf.seek(0)
    from fastapi.responses import Response
    return Response(content=zbuf.read(), media_type="application/zip",
                    headers={"Content-Disposition": "attachment; filename=factufad_csv.zip"})

@app.get("/export/pdf")
def export_pdf(_ = Depends(get_current_user)):
    buf = io.BytesIO()
    c = canvas.Canvas(buf)
    c.setFont("Helvetica-Bold", 16)
    c.drawString(50, 800, "Factufad – Resumen")
    from datetime import datetime as _dt
    c.setFont("Helvetica", 10)
    c.drawString(50, 785, f"Generado: {_dt.utcnow().isoformat()}Z")

    db = get_db()
    start, end = period_bounds('monthly')
    sales_docs = db.collection('sales').where('date', '>=', start).where('date', '<=', end).stream()
    ventas, cogs = 0.0, 0.0
    for d in sales_docs:
        s = d.to_dict(); ventas += float(s.get('total', 0))
        for it in s.get('items', []): cogs += float(it.get('unitCost', 0)) * float(it.get('quantity', 0))
    exp_docs = db.collection('expenses').where('date', '>=', start).where('date', '<=', end).stream()
    gastos = sum(float(e.to_dict().get('amount', 0)) for e in exp_docs)
    gan_bruta = ventas - cogs
    gan_neta = gan_bruta - gastos

    y = 750
    lines = [
        f"Ventas: $ {ventas:,.2f}",
        f"Costo de ventas (aprox): $ {cogs:,.2f}",
        f"Gastos: $ {gastos:,.2f}",
        f"Ganancia bruta: $ {gan_bruta:,.2f}",
        f"Ganancia neta: $ {gan_neta:,.2f}",
    ]
    c.setFont("Helvetica", 12)
    for ln in lines:
        c.drawString(50, y, ln); y -= 18

    c.showPage(); c.save()
    buf.seek(0)

    from fastapi.responses import Response
    return Response(content=buf.read(), media_type="application/pdf",
                    headers={"Content-Disposition": "attachment; filename=factufad_resumen.pdf"})

# ====== BACKUP ======
@app.get("/backup")
def backup_all(_ = Depends(require_role("admin"))):
    db = get_db()
    zbuf = io.BytesIO()
    with zipfile.ZipFile(zbuf, 'w', zipfile.ZIP_DEFLATED) as z:
        for name in ["users", "products", "sales", "purchases", "expenses"]:
            rows = []
            for d in db.collection(name).stream():
                r = d.to_dict(); r['id'] = d.id
                rows.append(r)
            # Save JSON lines for simplicity
            import json
            z.writestr(f"{name}.json", json.dumps(rows, ensure_ascii=False))
    zbuf.seek(0)
    from fastapi.responses import Response
    return Response(content=zbuf.read(), media_type="application/zip",
                    headers={"Content-Disposition": "attachment; filename=factufad_backup.zip"})

from fastapi import Header

@app.get("/__whoami")
def whoami(authorization: Optional[str] = Header(None)):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Token faltante")

    from firebase_admin import auth as fb_auth
    from .firestore_client import get_db
    get_db()  # init

    try:
        token = authorization.split(" ", 1)[1]
        decoded = fb_auth.verify_id_token(token)
        return {"ok": True, "uid": decoded.get("uid"), "email": decoded.get("email")}
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=401, detail="Token inválido")
