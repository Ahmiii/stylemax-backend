# StyleMax Backend

## Installation
Run `npm install` to install all dependencies.

## Development
Run `npm run dev` to start the development server.

## Production
Run `npm run build` to build the project.

OR

Run `npm run start` to start the production server.

## Stack
- Language: [TypeScript](https://www.typescriptlang.org/)
  - Strict mode: [false](https://www.typescriptlang.org/tsconfig#strict)
- Framework: [Express](https://expressjs.com/)
- DB: [PostgreSQL](https://www.postgresql.org/)
- ORM: [TypeORM](https://typeorm.io/#/)

# Code Structure
Loosely following conventions for MVC architecture. 

## Controllers
Each controller MUST inherit from `Controller` class.

**Reason** - Controller class proxies all requests to the child class. This allows us to add common functionality to all controllers. Like token refresh, error handling, etc.

