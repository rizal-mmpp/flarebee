# Flarebee Templates (Firebase Studio)

This is a Next.js project for selling templates and digital services, with a containerized backend.

## Running the Development Environment

This project uses a hybrid approach for development: the backend services (API, database, etc.) run in Docker containers, while the Next.js frontend runs directly on your local machine for the best hot-reloading experience.

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

| Service               | URL                                   | Description                                  |
| --------------------- | ------------------------------------- | -------------------------------------------- |
| **Web (Next.js)**     | `http://localhost:9002`               | The main frontend application.               |
| **API (Express.js)**  | `http://localhost:8000`               | The backend API service.                     |
| **PostgreSQL**        | `localhost:5432`                      | Database connection port.                    |
| **RabbitMQ**          | `http://localhost:15672`              | Message broker management UI.                |

The Next.js and Express.js services are configured with hot-reloading, so any changes you make to the code will be automatically reflected without needing to restart the servers.
