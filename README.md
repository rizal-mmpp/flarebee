# Flarebee Templates (Firebase Studio)

This is a Next.js project for selling templates and digital services, with a containerized backend.

## Architecture Overview

This project uses a microservices-oriented architecture for development:
- **Frontend (Next.js)**: Runs directly on your local machine for the best developer experience with hot-reloading.
- **Backend Services (Docker)**: All backend services are containerized using Docker and managed with Docker Compose. This ensures a consistent and isolated environment for the API and other services.

The backend services include:
- **API (Express.js + TypeScript)**: The main backend API for business logic.
- **PostgreSQL**: The primary relational database.
- **RabbitMQ**: A message broker for asynchronous tasks.
- **CMS Service (Placeholder)**: A dedicated service for content management.
- **File Manager (Placeholder)**: A dedicated service for file uploads and management.

## Running the Development Environment

**Prerequisites**:
- Docker installed and running on your system.
- Node.js and npm/yarn/pnpm installed on your local machine.

### Step 1: Start the Backend Services

The backend infrastructure is managed with Docker Compose. This includes the API, PostgreSQL database, and RabbitMQ message broker. To start all backend services, run:

```bash
docker-compose up --build
```
This command will build the API image if it doesn't exist and start all the containers defined in `docker-compose.yml`.

### Step 2: Start the Frontend Application

In a separate terminal window, navigate to the project's root directory and run the following command to start the Next.js frontend development server:

```bash
npm install
npm run dev
```

### Development URLs

Once both the Docker containers and the local frontend server are running, the services will be available at the following URLs:

| Service                       | URL                                   | Description                                       |
| ----------------------------- | ------------------------------------- | ------------------------------------------------- |
| **Web (Next.js)**             | `http://localhost:9002`               | The main frontend application.                    |
| **API (Express.js)**          | `http://localhost:8000`               | The backend API service.                          |
| **PostgreSQL**                | `localhost:5432`                      | Database connection port.                         |
| **RabbitMQ**                  | `http://localhost:15672`              | Message broker management UI.                     |
| **CMS Service (Placeholder)** | `http://localhost:1337`               | Placeholder for a future headless CMS.            |
| **File Manager (Placeholder)**| `http://localhost:8081`               | Placeholder for a future file management service. |

The Next.js and Express.js services are configured with hot-reloading, so any changes you make to the code will be automatically reflected without needing to restart the servers.
