"use client";
import { createContext, useContext, useReducer, useCallback } from "react";

/* ── seed data ─────────────────────────────────────────── */
const SAMPLE_FILES = {
  "src/index.js": `import express from 'express';
import { userRouter } from './routes/users.js';
import { authMiddleware } from './middleware/auth.js';

const app = express();
app.use(express.json());
app.use(authMiddleware);
app.use('/api/users', userRouter);

app.listen(3000, () => {
  console.log('Server running on port 3000');
});`,
  "src/routes/users.js": `import { Router } from 'express';
import { db } from '../db.js';

export const userRouter = Router();

userRouter.get('/', async (req, res) => {
  const users = await db.query('SELECT * FROM users');
  res.json(users);
});

userRouter.post('/', async (req, res) => {
  const { name, email } = req.body;
  const user = await db.insert('users', { name, email });
  res.status(201).json(user);
});`,
  "src/middleware/auth.js": `export function authMiddleware(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }
  try {
    req.user = verifyToken(token);
    next();
  } catch {
    res.status(403).json({ error: 'Invalid token' });
  }
}`,
  "src/db.js": `import pg from 'pg';

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
});

export const db = {
  query: (text, params) => pool.query(text, params),
  insert: async (table, data) => {
    const keys = Object.keys(data);
    const vals = Object.values(data);
    const placeholders = keys.map((_, i) => \`$\${i + 1}\`);
    const result = await pool.query(
      \`INSERT INTO \${table} (\${keys.join(', ')}) VALUES (\${placeholders.join(', ')}) RETURNING *\`,
      vals
    );
    return result.rows[0];
  }
};`,
  "tests/users.test.js": `import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { app } from '../src/index.js';

describe('Users API', () => {
  it('GET /api/users returns user list', async () => {
    const res = await request(app).get('/api/users');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it('POST /api/users creates a new user', async () => {
    const res = await request(app)
      .post('/api/users')
      .send({ name: 'Alice', email: 'alice@test.com' });
    expect(res.status).toBe(201);
    expect(res.body.name).toBe('Alice');
  });
});`,
  "package.json": `{
  "name": "my-api",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "node --watch src/index.js",
    "start": "node src/index.js",
    "test": "vitest run",
    "lint": "eslint src/"
  },
  "dependencies": {
    "express": "^4.18.2",
    "pg": "^8.11.3"
  },
  "devDependencies": {
    "vitest": "^1.2.0",
    "supertest": "^6.3.3",
    "eslint": "^8.56.0"
  }
}`,
};

const BACKLOG_STORIES = [
  { id: "STORY-101", title: "User registration endpoint", description: "Create POST /api/auth/register with email validation and password hashing", points: 5, priority: "high" },
  { id: "STORY-102", title: "Add pagination to user list", description: "Support ?page=&limit= query params on GET /api/users", points: 3, priority: "medium" },
  { id: "STORY-103", title: "Rate limiting middleware", description: "Add express-rate-limit to protect API from abuse", points: 2, priority: "high" },
  { id: "STORY-104", title: "User profile update", description: "Create PUT /api/users/:id to update user name and email", points: 3, priority: "medium" },
  { id: "STORY-105", title: "Add request logging", description: "Integrate morgan for HTTP request logging in development", points: 1, priority: "low" },
  { id: "STORY-106", title: "Database connection pooling", description: "Configure PG pool size and idle timeout for production", points: 2, priority: "high" },
  { id: "STORY-107", title: "Email verification flow", description: "Send verification email on signup with token-based confirmation", points: 8, priority: "medium" },
  { id: "STORY-108", title: "Health check endpoint", description: "Add GET /health that checks DB connectivity and returns status", points: 1, priority: "low" },
];

/* ── Pipeline YAML config ────────────────────────────── */
export const PIPELINE_YAML = `name: ci-cd-pipeline
on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

env:
  NODE_VERSION: '20.x'
  REGISTRY: ghcr.io
  IMAGE_NAME: \${{ github.repository }}

jobs:
  lint:
    name: Lint
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: \${{ env.NODE_VERSION }}
          cache: 'npm'
      - run: npm ci
      - run: npm run lint

  test:
    name: Test
    needs: lint
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:16
        env:
          POSTGRES_PASSWORD: test
          POSTGRES_DB: testdb
        ports:
          - 5432:5432
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: \${{ env.NODE_VERSION }}
          cache: 'npm'
      - run: npm ci
      - run: npm test
        env:
          DATABASE_URL: postgres://postgres:test@localhost:5432/testdb

  build:
    name: Build
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: docker/setup-buildx-action@v3
      - uses: docker/login-action@v3
        with:
          registry: \${{ env.REGISTRY }}
          username: \${{ github.actor }}
          password: \${{ secrets.GITHUB_TOKEN }}
      - uses: docker/build-push-action@v5
        with:
          context: .
          push: true
          tags: \${{ env.REGISTRY }}/\${{ env.IMAGE_NAME }}:\${{ github.sha }}
          cache-from: type=gha
          cache-to: type=gha,mode=max

  deploy-dev:
    name: Deploy to Dev
    needs: build
    runs-on: ubuntu-latest
    environment: development
    steps:
      - uses: actions/checkout@v4
      - name: Deploy to Dev
        run: |
          kubectl set image deployment/api \\
            api=\${{ env.REGISTRY }}/\${{ env.IMAGE_NAME }}:\${{ github.sha }} \\
            --namespace=dev
      - name: Verify deployment
        run: kubectl rollout status deployment/api --namespace=dev

  deploy-acc:
    name: Deploy to Acceptance
    needs: deploy-dev
    runs-on: ubuntu-latest
    environment: acceptance
    steps:
      - uses: actions/checkout@v4
      - name: Deploy to Acceptance
        run: |
          kubectl set image deployment/api \\
            api=\${{ env.REGISTRY }}/\${{ env.IMAGE_NAME }}:\${{ github.sha }} \\
            --namespace=acc
      - name: Run smoke tests
        run: npm run test:smoke -- --env=acc
      - name: Verify deployment
        run: kubectl rollout status deployment/api --namespace=acc

  deploy-prod:
    name: Deploy to Production
    needs: deploy-acc
    runs-on: ubuntu-latest
    environment:
      name: production
      url: https://api.myapp.com
    steps:
      - uses: actions/checkout@v4
      - name: Deploy to Production
        run: |
          kubectl set image deployment/api \\
            api=\${{ env.REGISTRY }}/\${{ env.IMAGE_NAME }}:\${{ github.sha }} \\
            --namespace=prod
      - name: Run smoke tests
        run: npm run test:smoke -- --env=prod
      - name: Verify deployment
        run: kubectl rollout status deployment/api --namespace=prod
`;

/* ── Infrastructure data ──────────────────────────────── */
export const INFRA_DATA = {
  environments: [
    {
      name: "Development",
      shortName: "dev",
      status: "healthy",
      url: "https://dev.api.myapp.com",
      cluster: "k8s-dev-eastus",
      replicas: 1,
      cpu: "250m",
      memory: "256Mi",
      uptime: "99.2%",
      lastDeploy: null,
      version: "1.0.0",
    },
    {
      name: "Acceptance",
      shortName: "acc",
      status: "healthy",
      url: "https://acc.api.myapp.com",
      cluster: "k8s-acc-eastus",
      replicas: 2,
      cpu: "500m",
      memory: "512Mi",
      uptime: "99.8%",
      lastDeploy: null,
      version: "1.0.0",
    },
    {
      name: "Production",
      shortName: "prod",
      status: "healthy",
      url: "https://api.myapp.com",
      cluster: "k8s-prod-eastus",
      replicas: 3,
      cpu: "1000m",
      memory: "1Gi",
      uptime: "99.99%",
      lastDeploy: null,
      version: "1.0.0",
    },
  ],
  services: [
    { name: "API Server", type: "Deployment", replicas: "3/3", status: "running", port: 3000 },
    { name: "PostgreSQL", type: "StatefulSet", replicas: "1/1", status: "running", port: 5432 },
    { name: "Redis Cache", type: "Deployment", replicas: "2/2", status: "running", port: 6379 },
    { name: "Ingress Controller", type: "DaemonSet", replicas: "2/2", status: "running", port: 443 },
  ],
  resources: {
    cpu: { used: 1.8, total: 4, unit: "cores" },
    memory: { used: 2.4, total: 8, unit: "GB" },
    pods: { used: 8, total: 20, unit: "pods" },
    storage: { used: 12, total: 50, unit: "GB" },
  },
};

/* ── initial state ───────────────────────────────────── */
const initialState = {
  /* Navigation */
  activeTab: "home",

  /* Agile */
  sprint: {
    number: 1,
    goal: "",
    status: "planning",
    startDate: null,
    endDate: null,
  },
  columns: {
    backlog: BACKLOG_STORIES.map((s) => ({ ...s, status: "backlog", branch: null, prId: null })),
    todo: [],
    inProgress: [],
    inReview: [],
    done: [],
  },
  sprintHistory: [],
  ceremonies: { active: null },

  /* VCS */
  files: { ...SAMPLE_FILES },
  originalFiles: { ...SAMPLE_FILES },
  currentFile: "src/index.js",
  branches: ["main"],
  currentBranch: "main",
  commits: [
    { sha: "a1b2c3d", message: "Initial commit — project setup", branch: "main", timestamp: Date.now() - 86400000, author: "You", files: Object.keys(SAMPLE_FILES) },
  ],
  stagedFiles: [],
  pullRequests: [],
  showDiff: false,

  /* CI/CD */
  pipelineRuns: [],
  activePipeline: null,

  /* Infrastructure */
  infra: { ...INFRA_DATA },

  /* Notifications */
  notifications: [],
};

/* ── reducer ─────────────────────────────────────────── */
function reducer(state, action) {
  switch (action.type) {
    case "SET_TAB":
      return { ...state, activeTab: action.payload };

    case "MOVE_TASK": {
      const { taskId, from, to } = action.payload;
      const task = state.columns[from].find((t) => t.id === taskId);
      if (!task) return state;
      const updated = { ...task, status: to };
      return {
        ...state,
        columns: {
          ...state.columns,
          [from]: state.columns[from].filter((t) => t.id !== taskId),
          [to]: [...state.columns[to], updated],
        },
      };
    }

    case "START_SPRINT":
      return {
        ...state,
        sprint: { ...state.sprint, status: "active", startDate: Date.now(), endDate: Date.now() + 14 * 86400000, goal: action.payload },
      };

    case "SET_CEREMONY":
      return { ...state, ceremonies: { active: action.payload } };

    case "COMPLETE_SPRINT": {
      const done = state.columns.done;
      const velocity = done.reduce((s, t) => s + (t.points || 0), 0);
      return {
        ...state,
        sprint: { number: state.sprint.number + 1, goal: "", status: "planning", startDate: null, endDate: null },
        sprintHistory: [...state.sprintHistory, { number: state.sprint.number, velocity, stories: done.length, goal: state.sprint.goal }],
        columns: { ...state.columns, done: [] },
      };
    }

    case "SET_FILE":
      return { ...state, currentFile: action.payload };

    case "EDIT_FILE":
      return { ...state, files: { ...state.files, [state.currentFile]: action.payload } };

    case "CREATE_BRANCH": {
      const branchName = action.payload;
      if (state.branches.includes(branchName)) return state;
      return { ...state, branches: [...state.branches, branchName], currentBranch: branchName };
    }

    case "SWITCH_BRANCH":
      return { ...state, currentBranch: action.payload };

    case "STAGE_FILE": {
      const file = action.payload;
      if (state.stagedFiles.includes(file)) return state;
      return { ...state, stagedFiles: [...state.stagedFiles, file] };
    }

    case "UNSTAGE_FILE":
      return { ...state, stagedFiles: state.stagedFiles.filter((f) => f !== action.payload) };

    case "COMMIT": {
      const sha = Math.random().toString(36).substring(2, 9);
      const commit = {
        sha,
        message: action.payload,
        branch: state.currentBranch,
        timestamp: Date.now(),
        author: "You",
        files: [...state.stagedFiles],
      };
      return {
        ...state,
        commits: [commit, ...state.commits],
        stagedFiles: [],
        originalFiles: { ...state.files },
      };
    }

    case "CREATE_PR": {
      const pr = {
        id: `PR-${state.pullRequests.length + 1}`,
        title: action.payload.title,
        description: action.payload.description,
        branch: state.currentBranch,
        status: "open",
        createdAt: Date.now(),
        commits: state.commits.filter((c) => c.branch === state.currentBranch && c.branch !== "main"),
        taskId: action.payload.taskId || null,
      };
      return { ...state, pullRequests: [pr, ...state.pullRequests] };
    }

    case "MERGE_PR": {
      const prId = action.payload;
      return {
        ...state,
        pullRequests: state.pullRequests.map((pr) => (pr.id === prId ? { ...pr, status: "merged" } : pr)),
        currentBranch: "main",
      };
    }

    case "TOGGLE_DIFF":
      return { ...state, showDiff: !state.showDiff };

    case "TRIGGER_PIPELINE": {
      const run = {
        id: `RUN-${state.pipelineRuns.length + 1}`,
        commit: action.payload.commit,
        branch: action.payload.branch,
        triggeredAt: Date.now(),
        stages: [
          { name: "Lint", status: "pending", logs: [], duration: null },
          { name: "Test", status: "pending", logs: [], duration: null },
          { name: "Build", status: "pending", logs: [], duration: null },
          { name: "Deploy Dev", status: "pending", logs: [], duration: null, env: "dev" },
          { name: "Deploy Acc", status: "pending", logs: [], duration: null, env: "acc" },
          { name: "Deploy Prod", status: "pending", logs: [], duration: null, env: "prod" },
        ],
        status: "running",
      };
      return { ...state, pipelineRuns: [run, ...state.pipelineRuns], activePipeline: run.id };
    }

    case "UPDATE_STAGE": {
      const { runId, stageIndex, update } = action.payload;
      return {
        ...state,
        pipelineRuns: state.pipelineRuns.map((run) =>
          run.id === runId
            ? {
              ...run,
              stages: run.stages.map((s, i) => (i === stageIndex ? { ...s, ...update } : s)),
            }
            : run
        ),
      };
    }

    case "COMPLETE_PIPELINE": {
      const { runId, status } = action.payload;
      return {
        ...state,
        pipelineRuns: state.pipelineRuns.map((run) => (run.id === runId ? { ...run, status } : run)),
      };
    }

    case "UPDATE_INFRA_DEPLOY": {
      const { envName, commitSha } = action.payload;
      return {
        ...state,
        infra: {
          ...state.infra,
          environments: state.infra.environments.map((e) =>
            e.shortName === envName ? { ...e, lastDeploy: Date.now(), version: commitSha.slice(0, 7) } : e
          ),
        },
      };
    }

    case "ADD_NOTIFICATION":
      return { ...state, notifications: [{ id: Date.now(), ...action.payload }, ...state.notifications].slice(0, 20) };

    case "DISMISS_NOTIFICATION":
      return { ...state, notifications: state.notifications.filter((n) => n.id !== action.payload) };

    default:
      return state;
  }
}

/* ── context ────────────────────────────────────────── */
const StoreContext = createContext(null);

export function StoreProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  const actions = {
    setTab: useCallback((tab) => dispatch({ type: "SET_TAB", payload: tab }), []),
    moveTask: useCallback((taskId, from, to) => dispatch({ type: "MOVE_TASK", payload: { taskId, from, to } }), []),
    startSprint: useCallback((goal) => dispatch({ type: "START_SPRINT", payload: goal }), []),
    setCeremony: useCallback((ceremony) => dispatch({ type: "SET_CEREMONY", payload: ceremony }), []),
    completeSprint: useCallback(() => dispatch({ type: "COMPLETE_SPRINT" }), []),
    setFile: useCallback((file) => dispatch({ type: "SET_FILE", payload: file }), []),
    editFile: useCallback((content) => dispatch({ type: "EDIT_FILE", payload: content }), []),
    createBranch: useCallback((name) => dispatch({ type: "CREATE_BRANCH", payload: name }), []),
    switchBranch: useCallback((name) => dispatch({ type: "SWITCH_BRANCH", payload: name }), []),
    stageFile: useCallback((file) => dispatch({ type: "STAGE_FILE", payload: file }), []),
    unstageFile: useCallback((file) => dispatch({ type: "UNSTAGE_FILE", payload: file }), []),
    commit: useCallback((message) => dispatch({ type: "COMMIT", payload: message }), []),
    createPR: useCallback((data) => dispatch({ type: "CREATE_PR", payload: data }), []),
    mergePR: useCallback((id) => dispatch({ type: "MERGE_PR", payload: id }), []),
    toggleDiff: useCallback(() => dispatch({ type: "TOGGLE_DIFF" }), []),
    triggerPipeline: useCallback((data) => dispatch({ type: "TRIGGER_PIPELINE", payload: data }), []),
    updateStage: useCallback((runId, stageIndex, update) => dispatch({ type: "UPDATE_STAGE", payload: { runId, stageIndex, update } }), []),
    completePipeline: useCallback((runId, status) => dispatch({ type: "COMPLETE_PIPELINE", payload: { runId, status } }), []),
    updateInfraDeploy: useCallback((envName, commitSha) => dispatch({ type: "UPDATE_INFRA_DEPLOY", payload: { envName, commitSha } }), []),
    addNotification: useCallback((n) => dispatch({ type: "ADD_NOTIFICATION", payload: n }), []),
    dismissNotification: useCallback((id) => dispatch({ type: "DISMISS_NOTIFICATION", payload: id }), []),
  };

  return <StoreContext.Provider value={{ state, actions, dispatch }}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used within StoreProvider");
  return ctx;
}
