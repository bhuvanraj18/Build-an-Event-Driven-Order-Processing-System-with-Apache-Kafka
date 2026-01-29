# Event-Driven Order Processing System

A robust backend system demonstrating event-driven architecture using **Node.js**, **Express**, **Apache Kafka**, and **Docker**. This project implements two decoupled microservices: an **Order Service** and a **Shipping Service**.

## Overview

The system simulates an e-commerce order processing flow:
1.  **Order Service**: Accepts order requests via REST API, validates input, persists order state, and publishes an `OrderCreated` event to Kafka.
2.  **Shipping Service**: Consumes `OrderCreated` events, performs idempotent processing (mock shipping scheduling), and publishes a `ShippingScheduled` event.

Key Features:
-   **Microservices Architecture**: Decoupled services with independent lifecycles.
-   **Event-Driven Communication**: Asynchronous messaging via Apache Kafka.
-   **Idempotency**: Ensures reliable processing of duplicate events.
-   **Fault Tolerance**: Implements Dead-Letter Queue (DLQ) strategy for failed messages.
-   **Containerization**: Full Docker support for easy setup and deployment.

## Architecture

```mermaid
graph LR
    User[User/Client] -- POST /api/orders --> OrderService[Order Service]
    OrderService -- Publish OrderCreated --> Kafka[Apache Kafka]
    Kafka -- Consume OrderCreated --> ShippingService[Shipping Service]
    ShippingService -- Publish ShippingScheduled --> Kafka
    ShippingService -. Error .-> DLQ[DLQ Topic]
```

## Prerequisites

-   **Docker** and **Docker Compose** installed on your machine.
-   **Node.js** (Optional, for local linting or running tests outside Docker).

## Getting Started

### 1. Clone the Repository
```bash
git clone <repository-url>
cd event-driven-order-system
```

### 2. Configure Environment
The project uses specific default ports. You can modify them in `.env.example` (or `docker-compose.yml` directly), but the defaults work out of the box.

### 3. Run the System
Build and start all services using Docker Compose:
```bash
docker-compose up -d --build
```
*Note: The first run might take a few minutes to download Docker images (Kafka, Zookeeper).*

### 4. Check Status
Verify that all containers are running and healthy:
```bash
docker-compose ps
```

## Usage & API

### Create an Order
To create a new order, send a POST request to the Order Service:

**Endpoint**: `POST http://localhost:3000/api/orders`
**Content-Type**: `application/json`

**Payload**:
```json
{
  "customerId": "cust-123",
  "items": [
    { "productId": "prod-A", "quantity": 2 },
    { "productId": "prod-B", "quantity": 1 }
  ]
}
```

**Response**:
```json
{
  "message": "Order created successfully",
  "orderId": "a1b2c3d4-...",
  "order": { ... }
}
```

## Testing

### Integration Test
A script is provided to verify the end-to-end flow.
1.  Ensure the system is running (`docker-compose up`).
2.  Run the test script:
    ```bash
    node tests/integration_test.js
    ```
3.  Check the logs to confirm shipment scheduling:
    ```bash
    docker-compose logs -f shipping-service
    ```
    You should see: `[Shipping Service] Successfully scheduled shipment for Order ID: ...`

### Unit Tests
(To be implemented - currently `npm test` scripts are placeholders).

## Design Decisions

-   **Kafka as Message Broker**: Chosen for high throughput and durability.
-   **Idempotency**: The Shipping Service maintains an in-memory `Set` of processed Order IDs to prevent duplicate processing. In a production environment, this would be a persistent store (e.g., Redis or SQL).
-   **Dead-Letter Queue (DLQ)**: Messages that fail processing (e.g., malformed JSON) are sent to a DLQ topic (`order_events_dlq`) to prevent blocking the consumer group.
-   **Zod Validation**: Used in Order Service to ensure data integrity before processing.

## Project Structure
-   `order-service/`: Express API for Orders.
-   `shipping-service/`: Kafka Consumer for Shipping logic.
-   `docker-compose.yml`: Infrastructure orchestration.
-   `tests/`: Integration tests.

## Troubleshooting
-   **Kafka Connection Errors**: If services fail to connect immediately, they will retry. Ensure 8GB+ RAM is available for Docker as Kafka/Zookeeper can be memory intensive.
-   **Port Conflicts**: Ensure ports 3000, 2181, 9092 are free.
"# Build-an-Event-Driven-Order-Processing-System-with-Apache-Kafka" 
