# Flarebee Templates (Firebase Studio)

This is a Next.js project for selling templates and digital services.

## Running with Docker

This project is configured to run in a containerized environment using Docker Compose.

**Prerequisites**:
- Docker installed and running.

**To start all services, run:**
```bash
docker-compose up --build
```

### Development URLs

Once the containers are running, the services will be available at the following URLs:

| Service               | URL                                   | Description                                  |
| --------------------- | ------------------------------------- | -------------------------------------------- |
| **Web (Next.js)**     | `http://localhost:9003`               | The main frontend application.               |
| **API (Express.js)**  | `http://localhost:8000`               | The backend API service.                     |
| **PostgreSQL**        | `localhost:5432`                      | Database connection port.                    |
| **RabbitMQ**          | `http://localhost:15672`              | Message broker management UI.                |

The Next.js and Express.js services are configured with hot-reloading, so any changes you make to the code in the `src` or `backend` directories will be automatically reflected without needing to restart the containers.
