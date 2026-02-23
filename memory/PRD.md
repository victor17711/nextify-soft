# Nextify Workspace - Employee Management Dashboard

## Original Problem Statement
Dashboard cu login pentru managementul angajaților:
- **Admin:** Acces complet, adăugare angajați, atribuire sarcini, calendar, notițe, tab "Clienți"
- **Angajat:** Vizualizare sarcini atribuite, calendar, notițe

## User Personas
1. **Administrator** - Gestionează echipa, clienți, sarcini, documente și rapoarte
2. **Angajat** - Vizualizează sarcinile atribuite, calendarul și notițele

## Core Requirements
- Autentificare JWT cu roluri (admin/employee)
- Management echipă cu avatare, procent din companie și specializare
- Sarcini cu date de început/sfârșit, atribuire multiplă
- Calendar vizual pentru sarcini
- Rapoarte zilnice de progres
- Documente organizate pe foldere (admin only)
- Cheltuieli (admin only) - în dezvoltare
- Profil utilizator cu actualizare avatar în timp real
- Tema dark/light
- Moneda: MDL

## Technical Stack
- **Frontend:** React, Tailwind CSS, Shadcn/UI, Axios
- **Backend:** FastAPI, MongoDB (motor async), JWT, bcrypt
- **Architecture:** SPA cu API RESTful, RBAC

## What's Been Implemented

### 2026-02-23
- [x] Avatar afișat în sidebar pentru utilizatorul curent
- [x] Câmp "% din Companie" pentru admini în pagina Echipa
- [x] Actualizare în timp real a numelui/avatarului în sidebar după modificări
- [x] Câmp "Specializare" cu 15 opțiuni colorate (Full Stack Developer, Web Designer, etc.)
- [x] Tab "Cheltuieli" în sidebar (doar admini) - pagină "În proces de lucru"
- [x] Sortare echipă: Admini primii, apoi Angajați (alfabetic)
- [x] Meniu sidebar compact (fără scroll)
- [x] Fix: % Companie se salvează și afișează corect la crearea utilizatorului

### Previous Sessions
- [x] Sistem autentificare JWT complet
- [x] Management echipă (CRUD utilizatori)
- [x] Management sarcini cu date start/end și atribuire multiplă
- [x] Calendar interactiv pentru vizualizare sarcini
- [x] Management clienți (CRUD)
- [x] Rapoarte zilnice de progres
- [x] Stocare documente pe foldere (admin only)
- [x] Pagină profil cu update avatar
- [x] Tema dark/light
- [x] Favicon personalizat
- [x] UI responsiv mobile
- [x] Stiluri hover/select corectate

## Position/Specialization Options
| Position | Color |
|----------|-------|
| Full Stack Developer | Violet |
| Frontend Developer | Blue |
| Backend Developer | Indigo |
| Mobile Developer | Cyan |
| Web Designer | Pink |
| UI/UX Designer | Fuchsia |
| Graphic Designer | Rose |
| SMM Specialist | Orange |
| Content Creator | Amber |
| SEO Specialist | Lime |
| Project Manager | Emerald |
| Business Developer | Teal |
| Sales Manager | Green |
| QA Engineer | Yellow |
| DevOps Engineer | Red |

## Database Schema
- **users:** id, name, email, phone, password_hash, role, avatar, company_share, position
- **tasks:** id, title, description, assigned_to[], start_date, due_date, status, priority
- **clients:** id, company_name, project_type, budget, monthly_fee, status, contact_*
- **reports:** id, user_id, date, content
- **documents:** id, name, path, folder_id
- **folders:** id, name, client_id

## API Endpoints
- `/api/auth/login`, `/api/auth/me`
- `/api/users`, `/api/users/{id}`
- `/api/tasks`, `/api/tasks/{id}`
- `/api/clients`, `/api/clients/{id}`
- `/api/reports`
- `/api/documents`, `/api/folders`
- `/api/stats/dashboard`

## Known Issues
- None currently

## Future Enhancements (P2)
- Implementare completă pagină Cheltuieli
- Export cod sursă ca .zip
- Notificări push pentru sarcini
- Statistici avansate pe dashboard
- Export rapoarte PDF
