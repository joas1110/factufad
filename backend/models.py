from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

class Product(BaseModel):
    id: Optional[str] = None
    name: str
    price: float
    cost: float
    stock: int = 0
    minStock: int = 0
    createdAt: Optional[datetime] = None

class SaleItem(BaseModel):
    productId: str
    productName: str
    quantity: int
    unitPrice: float
    unitCost: float
    subtotal: float

class Sale(BaseModel):
    id: Optional[str] = None
    date: datetime
    items: List[SaleItem]
    total: float
    grossProfit: float
    createdBy: Optional[str] = None
    createdAt: Optional[datetime] = None

class PurchaseItem(BaseModel):
    productId: str
    quantity: int
    unitCost: float
    subtotal: float

class Purchase(BaseModel):
    id: Optional[str] = None
    date: datetime
    supplier: str
    items: List[PurchaseItem]
    total: float
    createdBy: Optional[str] = None
    createdAt: Optional[datetime] = None

class Expense(BaseModel):
    id: Optional[str] = None
    date: datetime
    category: str  # 'fijo' | 'variable'
    subcategory: Optional[str] = None
    description: Optional[str] = None
    amount: float
    createdBy: Optional[str] = None
    createdAt: Optional[datetime] = None
