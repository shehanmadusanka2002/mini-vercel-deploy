# 🚀 Mini-Vercel: Automated Cloud Deployment Platform

![Project Status](https://img.shields.io/badge/status-active-success.svg)
![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Tech Stack](https://img.shields.io/badge/stack-MERN%20%2B%20Docker-blueviolet)

> A custom-built cloud deployment platform mimicking the core functionality of Vercel. It enables users to deploy React applications automatically from GitHub using Docker containers and a custom reverse proxy system.

---

## 📖 Overview

This project is an **automated CI/CD platform** built to understand the internal workings of cloud hosting providers like Vercel or Netlify. It solves the problem of manual deployment by automating the process of cloning, building, and serving web applications in isolated environments.

Users can login with GitHub, select a repository, and within seconds, receive a live URL (e.g., `project-name.13.60.x.x.nip.io`) pointing to their deployed application.

## 🏗️ System Architecture

The system consists of three main microservices running on an **AWS EC2** instance:

1.  **API Server:** Handles GitHub OAuth, fetches repositories, and orchestrates Docker containers using `dockerode`.
2.  **Reverse Proxy:** Intercepts incoming HTTP requests and routes them to the correct Docker container based on the subdomain.
3.  **Dashboard (Frontend):** A React-based UI for users to manage deployments and view logs.
4.  **Redis:** Acts as a fast key-value store to map subdomains (e.g., `my-app`) to internal Docker container ports.

---

## 🛠️ Tech Stack

### Core Infrastructure
* **Cloud Provider:** AWS EC2 (Ubuntu Linux)
* **Containerization:** Docker & Dockerode
* **Routing:** Custom Node.js Reverse Proxy
* **DNS Management:** `nip.io` for dynamic wildcard subdomains

### Backend
* **Runtime:** Node.js
* **Framework:** Express.js
* **Database:** Redis (for mapping URLs to Ports)
* **Git Integration:** `simple-git`
* **Security:** GitHub OAuth 2.0

### Frontend
* **Framework:** React.js (Vite)
* **Styling:** CSS3 / Styled Components
* **HTTP Client:** Axios

---

## ✨ Key Features

* **🔐 GitHub Authentication:** Secure login using OAuth 2.0.
* **📂 Auto-Import:** Fetches user's repositories directly from GitHub.
* **🐳 Containerized Builds:** Each project is built and served inside its own Docker container for security and isolation.
* **🔀 Reverse Proxying:** Dynamically routes traffic from `subdomain.ip.nip.io` to the specific internal port of the container.
* **⚡ Automated Build Pipeline:**
    1.  Clone Repository
    2.  Detect `package.json`
    3.  Generate Dockerfile
    4.  Build Docker Image
    5.  Spin up Container
    6.  Map Port in Redis

---

## 🚀 How to Run Locally

Follow these steps to set up the project on your local machine.

### Prerequisites
* Node.js (v18+)
* Docker Desktop (Running)
* Redis Server (Running)

### 1. Clone the Repository
```bash
git clone [https://github.com/](https://github.com/)[YOUR_USERNAME]/[REPO_NAME].git
cd [REPO_NAME]
