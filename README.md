# Factufad (MVP)
Pasos rápidos:

1) Crea un proyecto en Firebase (Auth Email/Password + Firestore). Genera la clave de Service Account y guárdala como `backend/serviceAccount.json` (o usa la variable GOOGLE_APPLICATION_CREDENTIALS_JSON con el contenido).
2) Backend:
   ```powershell
   cd backend
   python -m venv .venv
   .\.venv\Scripts\Activate.ps1
   pip install -r requirements.txt
   $env:FIREBASE_PROJECT_ID="TU_ID"
   $env:ALLOWED_ORIGINS="http://localhost:5173"
   $env:GOOGLE_APPLICATION_CREDENTIALS_FILE="$PWD\serviceAccount.json"
   uvicorn backend.app:app --reload
   ```
3) Frontend:
   ```powershell
   cd frontend
   copy .env.example .env
   # Edita .env con las keys de tu Firebase y la URL del backend si no es local
   npm install
   npm run dev
   # Abre http://localhost:5173
   ```
4) Loguéate con un usuario creado en Firebase. Luego ve a `/admin` y asígnate rol `admin` con tu UID.
5) Carga productos, registra ventas, compras y gastos. Ve el Dashboard y prueba las exportaciones.
