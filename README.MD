```
git clone https://github.com/nguyenduclong-ict/mongoose-orm-crud.git
npm install
cp .env.example .env
```

```
# Development
# Set NODE_ENV=development in .env file
npm run dev
```

```
# Build
npm run build
```

```
# Start
# Set NODE_ENV=production in .env file
npm run start
```

### Route

```typescript
# src/api/todo.api.ts

import { todoRepository } from "../entities/todo";
import { Api } from "../helpers/gateway";
import { RequestHandler } from "express";

const makeDoneTodo : RequestHandler = (req, res, next) => {
    res.json('success')
}

export default {
  path: "/todo",
  // generate crud methods for todo entity
  repository: todoRepository,
    // set crud methods
    // default =  ["list","find","findOne","create","bulkCreate","update","updateOne","delete","deleteOne",]
   // middlewares will pass begin of endpoint
  crudMethods: ['list', {name: 'find', middlewares: [] }],
  // middleware pass to router (optionnal)
  middlewares : [],
  // custom routes
  routes : {
    'POST /done' : makeDoneTodo
  },
} as Api;

// example query list todo and populate comments
GET /todo?populates=["comments"]

```
