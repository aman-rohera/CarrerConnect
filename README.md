<div align="center">

# 💼 CareerConnect

### *Your Gateway to Professional Opportunities*

<br/>

```
   ╔═══════════════════════════════════════════════════════════════╗
   ║                                                               ║
   ║     🚀  Connect. Apply. Succeed. Your Career Starts Here  🚀 ║
   ║                                                               ║
   ╚═══════════════════════════════════════════════════════════════╝
```

<br/>

[![Python](https://img.shields.io/badge/Python-3.8+-3776AB?style=for-the-badge&logo=python&logoColor=white)](https://python.org)
[![Django](https://img.shields.io/badge/Django-6.0-092E20?style=for-the-badge&logo=django&logoColor=white)](https://djangoproject.com)
[![React](https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://typescriptlang.org)
[![Vite](https://img.shields.io/badge/Vite-5.0-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev)

<br/>

*Built with ❤️ for **Winter of Code 8.0***

---

</div>

## 🎯 About The Project

**CareerConnect** is a modern, full-stack job recruitment platform that bridges the gap between talented professionals and leading employers. Built with cutting-edge technologies, it provides a seamless experience for both job seekers looking for their dream role and recruiters searching for top talent.

> *"Where talent meets opportunity — building careers, one connection at a time."*

<br/>

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│   🌐 FRONTEND                        ⚙️ BACKEND                 │
│   ══════════                         ═════════                  │
│                                                                 │
│   React + Vite        ◄─── REST API ───►    Django REST        │
│   TypeScript                                 Framework          │
│   React Router                               JWT Auth           │
│   Axios                                      PostgreSQL         │
│                                              Cloudinary         │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

<br/>

## ✨ Features

<table>
<tr>
<td width="50%">

### 👤 For Job Seekers
- 🔍 Browse and search job listings
- 📄 Upload and manage resumes
- 📋 Track application status in real-time
- 👤 Build professional profiles
- ❌ Withdraw applications anytime

</td>
<td width="50%">

### 🏢 For Employers
- 📝 Post and manage job openings
- 👁️ Review candidate applications
- ✅ Accept/Reject candidates
- 📊 Dashboard with analytics
- 🔒 Secure employer portal

</td>
</tr>
</table>

<br/>

## 🛠️ Tech Stack

<table align="center">
<tr>
<th>🖥️ Frontend</th>
<th>⚙️ Backend</th>
<th>🗄️ Database & Storage</th>
</tr>
<tr>
<td>

| Technology | Purpose |
|:---:|:---|
| ![React](https://img.shields.io/badge/-React_18-61DAFB?style=flat-square&logo=react&logoColor=black) | UI Library |
| ![TypeScript](https://img.shields.io/badge/-TypeScript-3178C6?style=flat-square&logo=typescript&logoColor=white) | Type Safety |
| ![Vite](https://img.shields.io/badge/-Vite-646CFF?style=flat-square&logo=vite&logoColor=white) | Build Tool |
| ![Router](https://img.shields.io/badge/-React_Router-CA4245?style=flat-square&logo=react-router&logoColor=white) | Navigation |
| ![Axios](https://img.shields.io/badge/-Axios-5A29E4?style=flat-square&logo=axios&logoColor=white) | HTTP Client |

</td>
<td>

| Technology | Purpose |
|:---:|:---|
| ![Django](https://img.shields.io/badge/-Django_6.0-092E20?style=flat-square&logo=django&logoColor=white) | Framework |
| ![DRF](https://img.shields.io/badge/-DRF-ff1709?style=flat-square&logo=django&logoColor=white) | REST API |
| ![JWT](https://img.shields.io/badge/-SimpleJWT-000000?style=flat-square&logo=json-web-tokens&logoColor=white) | Auth |
| ![Python](https://img.shields.io/badge/-Python_3.8+-3776AB?style=flat-square&logo=python&logoColor=white) | Language |

</td>
<td>

| Technology | Purpose |
|:---:|:---|
| ![PostgreSQL](https://img.shields.io/badge/-PostgreSQL-4169E1?style=flat-square&logo=postgresql&logoColor=white) | Database |
| ![Cloudinary](https://img.shields.io/badge/-Cloudinary-3448C5?style=flat-square&logo=cloudinary&logoColor=white) | File Storage |
| ![SQLite](https://img.shields.io/badge/-SQLite-003B57?style=flat-square&logo=sqlite&logoColor=white) | Dev DB |

</td>
</tr>
</table>

<br/>

---

## 🚀 Quick Start

### 📋 Prerequisites

Before getting started, ensure you have the following installed:

| Tool | Version | Purpose |
|:---:|:---:|:---|
| 🐍 Python | 3.8+ | Backend runtime |
| 📦 Node.js | 18+ | Frontend runtime |
| 🔧 Git | Latest | Version control |
| 📜 pip | Latest | Package manager |

<br/>

### ⚡ Installation

<details>
<summary><b>📥 Step 1: Clone the Repository</b></summary>

```bash
git clone https://github.com/<aman-rohera>/woc8.0-job-recruitment-<aman-rohera>.git
cd woc8.0-job-recruitment-<aman-rohera>
```

</details>

<details>
<summary><b>🐍 Step 2: Set Up Virtual Environment</b></summary>

```bash
python -m venv venv

# 🪟 Windows
.\venv\Scripts\activate

# 🍎 Mac / 🐧 Linux
source venv/bin/activate
```

</details>

<details>
<summary><b>⚙️ Step 3: Backend Setup</b></summary>

```bash
# Navigate to backend directory
cd backend

# Install dependencies
pip install -r requirements.txt

# Configure environment variables
cp .env.example .env
# Edit .env with your Cloudinary and database credentials

# Run database migrations
python manage.py makemigrations
python manage.py migrate

# Create admin account
python manage.py createsuperuser

# Start the backend server
python manage.py runserver
```

🌐 Backend runs at: `http://localhost:8000`

</details>

<details>
<summary><b>⚛️ Step 4: Frontend Setup</b></summary>

```bash
# Open a new terminal and navigate to frontend
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

🌐 Frontend runs at: `http://localhost:5173`

</details>

<br/>

---

## 📡 API Endpoints

<details>
<summary><b>🔐 Authentication</b> <code>/api/auth/</code></summary>

| Method | Endpoint | Description | Access |
|:---:|:---|:---|:---:|
| `POST` | `/register/` | Register new user | Public |
| `POST` | `/login/` | Get JWT tokens | Public |
| `POST` | `/logout/` | Blacklist token | Auth |
| `POST` | `/token/refresh/` | Refresh access token | Auth |
| `GET` | `/me/` | Get current user info | Auth |
| `PATCH` | `/profile/` | Update user profile | Auth |
| `POST` | `/password/change/` | Change password | Auth |
| `POST` | `/upload-resume/` | Upload resume | Auth |
| `DELETE` | `/delete-account/` | Delete account | Auth |

</details>

<details>
<summary><b>💼 Jobs</b> <code>/api/jobs/</code></summary>

| Method | Endpoint | Description | Access |
|:---:|:---|:---|:---:|
| `GET` | `/` | List all jobs | Public |
| `GET` | `/<id>/` | Get job details | Public |
| `POST` | `/create/` | Create new job | Employer |
| `PATCH` | `/<id>/update/` | Update job | Owner |
| `DELETE` | `/<id>/delete/` | Delete job | Owner |
| `GET` | `/my-jobs/` | List employer's jobs | Employer |

</details>

<details>
<summary><b>📋 Applications</b> <code>/api/applications/</code></summary>

| Method | Endpoint | Description | Access |
|:---:|:---|:---|:---:|
| `POST` | `/apply/<job_id>/` | Apply for job | Seeker |
| `GET` | `/my/` | List my applications | Seeker |
| `GET` | `/<id>/` | Application details | Owner |
| `DELETE` | `/<id>/withdraw/` | Withdraw application | Owner |
| `GET` | `/job/<job_id>/` | Job's applicants | Employer |
| `PATCH` | `/<id>/status/` | Update status | Employer |

</details>

<br/>

---

## 📁 Project Structure

```
📦 careerconnect/
│
├── ⚙️ backend/                    # Django REST API
│   ├── 👤 souls/                  # User authentication & profiles
│   │   ├── api_views.py           # Auth API endpoints
│   │   ├── serializers.py         # Data serialization
│   │   └── models.py              # User model
│   │
│   ├── 💼 jobs/                   # Job management
│   │   ├── api_views.py           # Jobs CRUD endpoints
│   │   ├── serializers.py         # Job serialization
│   │   └── models.py              # JobPost model
│   │
│   ├── 📋 applications/           # Application handling
│   │   ├── api_views.py           # Application endpoints
│   │   ├── serializers.py         # Application serialization
│   │   └── models.py              # Application model
│   │
│   ├── ⚙️ job_recruitment/        # Django settings
│   ├── 📁 media/                  # Uploaded files
│   ├── 🗄️ db.sqlite3              # Development database
│   └── 📜 requirements.txt        # Python dependencies
│
├── ⚛️ frontend/                   # React SPA
│   ├── 📁 src/
│   │   ├── 🧩 components/         # Reusable UI components
│   │   ├── 📄 pages/              # Page components
│   │   ├── 🔐 context/            # Auth context provider
│   │   └── 🔌 services/           # API service layer
│   ├── 📦 package.json
│   └── ⚡ vite.config.ts
│
├── 🐍 venv/                       # Virtual environment
└── 📖 README.md                   # Documentation
```

<br/>

---

## 🤝 Contributing

<div align="center">

*We welcome contributions from the community!*

</div>

```
 1. 🍴 Fork the repository
 2. 🌿 Create feature branch    →  git checkout -b feature/NewFeature
 3. ✨ Commit your changes      →  git commit -m 'Add NewFeature'
 4. 📤 Push to branch           →  git push origin feature/NewFeature
 5. 🔄 Open a Pull Request
```

<br/>

---

## 📚 Documentation

| Resource | Link |
|:---|:---|
| 🐍 Django Documentation | [docs.djangoproject.com](https://docs.djangoproject.com/) |
| ⚛️ React Documentation | [react.dev](https://react.dev/) |
| 🔐 DRF SimpleJWT | [django-rest-framework-simplejwt.readthedocs.io](https://django-rest-framework-simplejwt.readthedocs.io/) |
| ☁️ Cloudinary Docs | [cloudinary.com/documentation](https://cloudinary.com/documentation) |

<br/>

---

<div align="center">

## 📜 License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

<br/>

---

### ⭐ Star this repo if you found it helpful!

<br/>

```
   ╔═══════════════════════════════════════════════════════════════╗
   ║                                                               ║
   ║      ██████╗ █████╗ ██████╗ ███████╗███████╗██████╗           ║
   ║     ██╔════╝██╔══██╗██╔══██╗██╔════╝██╔════╝██╔══██╗          ║
   ║     ██║     ███████║██████╔╝█████╗  █████╗  ██████╔╝          ║
   ║     ██║     ██╔══██║██╔══██╗██╔══╝  ██╔══╝  ██╔══██╗          ║
   ║     ╚██████╗██║  ██║██║  ██║███████╗███████╗██║  ██║          ║
   ║      ╚═════╝╚═╝  ╚═╝╚═╝  ╚═╝╚══════╝╚══════╝╚═╝  ╚═╝          ║
   ║                    SPHERE                                     ║
   ║                                                               ║
   ║               Winter of Code 8.0                              ║
   ╚═══════════════════════════════════════════════════════════════╝
```

<br/>

Made with ❤️ and ☕ by **Aman Rohera**

*"Building bridges between talent and opportunity"*

</div>
