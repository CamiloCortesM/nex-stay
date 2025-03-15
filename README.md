# Nex-Stay - Hotel Management System

![NestJS](https://img.shields.io/badge/nestjs-E0234E?style=for-the-badge&logo=nestjs&logoColor=white)
![GraphQL](https://img.shields.io/badge/-GraphQL-E10098?style=for-the-badge&logo=graphql&logoColor=white)
![Prisma](https://img.shields.io/badge/Prisma-3982CE?style=for-the-badge&logo=Prisma&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-2CA5E0?style=for-the-badge&logo=docker&logoColor=white)

## Descripción del Proyecto

Sistema de gestión hotelera con las siguientes características principales:

- **Autenticación Segura**: Integración con AWS Cognito
- **Gestión de Reservas**: Cálculos automáticos de precios y disponibilidad
- **Búsqueda Avanzada**: Filtrado de habitaciones con paginación
- **Arquitectura Moderna**: GraphQL API con NestJS y Prisma ORM
- **Despliegue Simplificado**: Configuración Docker para base de datos

### Check-in y Check-out

El check-in suele realizarse en la tarde, generalmente después de las 4:00 p.m. y cuenta como una sola noche (no dia). El check-out suele realizarse antes de las 12:00 p.m. por lo que no se cobra una noche adicional.

## 🚀 Instrucciones de Ejecución

### Prerrequisitos

- Node.js v18+
- npm v9+
- Docker y Docker Compose
- Cuenta AWS con Cognito configurado

### 1. Configuración Inicial

```bash
git clone https://github.com/CamiloCortesM/nex-stay.git
cd nex-stay
npm install
```

### 2. Configuración de Base de Datos

```bash
# Iniciar contenedor PostgreSQL
docker-compose up -d

# Configurar variables de entorno (.env)
echo "DATABASE_URL=\"postgresql://postgres:123456@localhost:5432/nexstaydb?schema=public\"" >> .env

# Ejecutar migraciones y seed
npx prisma migrate dev
npx prisma db seed
```

### 3. Configuración AWS Cognito

Crear archivo .env con:

```env
PORT=3005
AWS_COGNITO_CLIENT_ID=tu_client_id
AWS_COGNITO_USER_POOL_ID=tu_user_pool_id
AWS_COGNITO_AUTHORITY=https://cognito-idp.region.amazonaws.com/your_user_pool_id

DATABASE_URL="postgresql://postgres:123456@localhost:5432/nexstaydb?schema=public"
```

### 4. Iniciar Servidor

```bash
npm run start:dev
```

## 🛠 Tecnologías Utilizadas (Actualizado)

### Backend Core

- **NestJS v11**: Framework principal con arquitectura modular
- **GraphQL v16**: Implementación con Apollo Server 4
- **Prisma v6.5**: ORM moderno con type-safety
- **AWS Cognito**: Autenticación empresarial
- **PostgreSQL v16**: Base de datos relacional
- **RxJS v7**: Programación reactiva

### Seguridad

- **JWT v9**: Tokens de autenticación
- **Passport v0.7**: Estrategias de autenticación
  - **passport-jwt**: Autenticación por tokens
  - **passport-local**: Autenticación tradicional
- **jwks-rsa**: Validación de cles RSA para Cognito

### Desarrollo y Testing

- **TypeScript v5.7**: Tipado estático avanzado
- **Jest v29**: Suite de pruebas con cobertura
- **SWC**: Compilador ultra-rápido
- **ts-node**: Ejecución directa de TypeScript

### Herramientas de Calidad

- **ESLint v9 + Prettier v3**: Linter y formateador
- **Class-Validator**: Validación de DTOs
- **Joi v17**: Validación de variables de entorno

### Infraestructura

- **Docker**: Contenerización de servicios
- **tsconfig-paths**: Resolución de paths absolutos
- **source-map-support**: Depuración en producción

### Paquetes Clave

- **Apollo Server 4**: Servidor GraphQL de última generación
- **NestJS GraphQL**: Integración GraphQL con NestJS
- **Amazon Cognito SDK**: SDK oficial para integración
- **Prisma Client**: Generación automática de queries
- **Class Transformer**: Serialización de objetos

### Workflow

- **Nest CLI**: Generación de recursos
- **Prisma CLI**: Manejo de migraciones
- **SWC Core**: Compilación optimizada

## 🌱 Seed de Prisma

### Datos Iniciales

El archivo `prisma/seed.ts` incluye:

- 3 tipos de habitaciones
- Precios base iniciales
- Maxima Capacidad
- Si es de vista Exterior o Interior

### Ejecutar Seed Manualmente

```bash
npx prisma db seed
```

## 📚 Documentación de la API

### Autenticación 🔐

| Operación         | Tipo     | Descripción                    | Parámetros                           |
| ----------------- | -------- | ------------------------------ | ------------------------------------ |
| `signup`          | Mutation | Registro de usuario            | email, password, name                |
| `login`           | Mutation | Inicio de sesión (retorna JWT) | email, password                      |
| `changePassword`  | Mutation | Cambiar contraseña             | currentPassword, email, newPassword  |
| `forgotPassword`  | Mutation | Recuperación de contraseña     | email                                |
| `confirmPassword` | Mutation | Confirmar nueva contraseña     | confirmationCode, newPassword, email |

### Reservas 🛎

| Operación           | Tipo     | Descripción                  | Parámetros                                      |
| ------------------- | -------- | ---------------------------- | ----------------------------------------------- |
| `createReservation` | Mutation | Crear reserva                | checkIn, checkOut, people,roomType,allInclusive |
| `cancelReservation` | Mutation | Cancelar reserva             | reservationId                                   |
| `reservation`       | Query    | Obtener reserva por ID       | reservationId                                   |
| `reservations`      | Query    | Listado paginado de reservas | limit, offset                                   |

### Habitaciones 🏨

| Operación        | Tipo  | Descripción                          | Parámetros                                                                         |
| ---------------- | ----- | ------------------------------------ | ---------------------------------------------------------------------------------- |
| `roomTypes`      | Query | Lista tipos de habitación            | -                                                                                  |
| `availableRooms` | Query | Búsqueda de habitaciones disponibles | checkIn, checkOut, people, roomType, exteriorViewOnly, allInclusive, limit, offset |

## 🐳 Configuración Docker

Archivo `docker-compose.yml`:

```yaml
version: '3'

services:
  nexstay-db:
    container_name: nexstay-db
    image: postgres:16.2
    restart: always
    volumes:
      - ./postgres:/var/lib/postgresql/data
    ports:
      - '5432:5432'
    environment:
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=123456
      - POSTGRES_DB=nexstaydb
```

Comandos útiles:

```bash
# Iniciar base de datos
docker-compose up -d

# Detener contenedor
docker-compose down

# Ver logs
docker logs nexstay-db -f
```


