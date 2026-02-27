"use client";
import { createContext, useContext, useState, useCallback } from "react";

/*
  Tutorial steps define the entire guided walkthrough.
  Each step has:
    - id: unique identifier
    - tab: which tab to be on (or null for overlay-only)
    - title: step heading
    - description: what to do / explanation
    - hint: optional shorter prompt
    - action: what the user needs to do (or "auto" / "continue" for non-interactive steps)
    - position: where to show the modal (center | bottom-right | top)
    - highlight: CSS selector or component area to highlight (informational, not enforced)
*/

export const TUTORIAL_STEPS = [
    {
        id: "welcome",
        tab: null,
        title: "Welcome to SWE Sim",
        description:
            "This guided tutorial will walk you through a complete software engineering workflow — exactly how real teams ship code.\n\nYou'll pick up a user story, create a branch, write code, deal with a merge conflict, open a pull request, and watch CI/CD deploy to production.\n\nYou can skip this tutorial at any time.",
        action: "continue",
        position: "center",
    },
    {
        id: "agile-overview",
        tab: "agile",
        title: "The Agile Board",
        description:
            'This is your team\'s Kanban board. Work items (called "user stories") live here and move left-to-right as they progress.\n\nStories in the Backlog haven\'t been started yet. Your team picks stories during Sprint Planning and moves them to "To Do" for the current sprint.',
        action: "continue",
        position: "top",
    },
    {
        id: "pick-story",
        tab: "agile",
        title: "Pick Up a Story",
        description:
            'Let\'s pick up **STORY-108: Health check endpoint** — it\'s a 1-point task, perfect for learning.\n\nThis is a **feature** story: we need to add a GET /health endpoint that checks if the database is connected and returns a status.\n\nClick on the STORY-108 card in the Backlog, then click the arrow button to move it to **"To Do"**, then move it again to **"In Progress"**.',
        hint: 'Move STORY-108 to "In Progress"',
        action: "move-task-in-progress",
        validate: (state) => state.columns.inProgress.some((t) => t.id === "STORY-108"),
        position: "bottom-right",
    },
    {
        id: "branch-created",
        tab: "agile",
        title: "A Branch Was Created",
        description:
            'Notice the notification: when you moved the story to "In Progress", a Git **feature branch** was automatically created: `feature/story-108`.\n\nThis is a common pattern in real teams — each story gets its own branch so developers can work in isolation without breaking the main codebase.\n\nLet\'s head to the Code & VCS tab to start coding.',
        action: "continue",
        position: "bottom-right",
    },
    {
        id: "code-overview",
        tab: "code",
        title: "The Code Editor & Version Control",
        description:
            "You're now on the Code & VCS screen. Here you can:\n\n- **Edit files** in the editor (left)\n- **Stage & commit** changes (right panel)\n- **Create branches** and **pull requests**\n- **View diffs** of your changes\n\nNotice you're on the `feature/story-108` branch — your changes are isolated from `main`.",
        action: "continue",
        position: "top",
    },
    {
        id: "edit-code",
        tab: "code",
        title: "Write the Code",
        description:
            'Click on **src/index.js** in the file tree. We need to add a health check endpoint.\n\nFind the line `app.listen(3000, () => {` and add this code **right before it**:\n\n```\napp.get(\'/health\', async (req, res) => {\n  try {\n    await db.query(\'SELECT 1\');\n    res.json({ status: \'healthy\', timestamp: Date.now() });\n  } catch {\n    res.status(503).json({ status: \'unhealthy\' });\n  }\n});\n```\n\nJust type or paste the code into the editor. You\'ll see the file marked as modified with a yellow dot.',
        hint: "Edit src/index.js to add the health check route",
        action: "edit-file",
        validate: (state) => {
            const content = state.files["src/index.js"] || "";
            return content.includes("/health") || content.includes("health");
        },
        position: "bottom-right",
    },
    {
        id: "stage-changes",
        tab: "code",
        title: "Stage Your Changes",
        description:
            'In the right panel under **"Changed Files"**, you should see src/index.js listed.\n\nHover over it and click **"Stage"** (or use the "Stage All" button). Staging tells Git which changes you want to include in your next commit.\n\nThis is like putting items in a box before shipping — you choose exactly what goes in each commit.',
        hint: "Stage the modified file",
        action: "stage-file",
        validate: (state) => state.stagedFiles.length > 0,
        position: "bottom-right",
    },
    {
        id: "commit-changes",
        tab: "code",
        title: "Commit Your Changes",
        description:
            'Write a commit message following **conventional commits** format:\n\n`feat: add health check endpoint`\n\nConventional commits start with a type (`feat`, `fix`, `chore`, `docs`) followed by a description. This makes the git history readable and can auto-generate changelogs.\n\nType the message and click **"Commit"**.',
        hint: "Write a commit message and commit",
        action: "commit",
        validate: (state) => state.commits.some((c) => c.branch === "feature/story-108"),
        position: "bottom-right",
    },
    {
        id: "merge-conflict-intro",
        tab: "code",
        title: "Uh Oh — Merge Conflict!",
        description:
            "While you were working, a teammate pushed changes to the **same file** on the `main` branch. This is called a **merge conflict** — Git can't automatically merge because both of you changed the same lines.\n\nThis happens ALL THE TIME in real teams. Don't panic! We'll switch to `main`, see their changes, then switch back to resolve the conflict.\n\nClick **Continue** and we'll simulate this for you.",
        action: "trigger-conflict",
        position: "center",
    },
    {
        id: "resolve-conflict",
        tab: "code",
        title: "Resolve the Conflict",
        description:
            'Look at `src/index.js` — you\'ll see **conflict markers** in the code:\n\n```\n<<<<<<< feature/story-108\n  (your changes)\n=======\n  (their changes)\n>>>>>>> main\n```\n\nTo resolve it, **remove the conflict markers** (`<<<<<<<`, `=======`, `>>>>>>>`) and keep BOTH changes. In a real codebase you\'d decide which code to keep — in this case we want both.\n\nEdit the file to remove the markers, then stage and commit with message:\n`fix: resolve merge conflict in index.js`',
        hint: "Remove conflict markers, stage, and commit",
        action: "resolve-conflict",
        validate: (state) => {
            const content = state.files["src/index.js"] || "";
            const hasConflictMarkers = content.includes("<<<<<<<") || content.includes(">>>>>>>");
            const hasNewCommit = state.commits.length >= 3;
            return !hasConflictMarkers && hasNewCommit;
        },
        position: "bottom-right",
    },
    {
        id: "create-pr",
        tab: "code",
        title: "Create a Pull Request",
        description:
            'Your code is ready! Click the **"Create PR"** button in the toolbar.\n\nA Pull Request (PR) is how you propose merging your branch into `main`. In real teams:\n- Other developers **review** your code\n- Automated checks run (linting, tests)\n- A tech lead **approves** before merge\n\nFill in the title and description, then create it.',
        hint: "Click Create PR and fill in the details",
        action: "create-pr",
        validate: (state) => state.pullRequests.some((pr) => pr.branch === "feature/story-108"),
        position: "bottom-right",
    },
    {
        id: "merge-pr",
        tab: "code",
        title: "Code Review & Merge",
        description:
            'In the right panel, switch to the **"PRs"** tab. You\'ll see your open pull request.\n\nIn a real team, another developer would review your code, leave comments, and approve it. For this tutorial, you\'re the reviewer too.\n\nClick **"Approve & Merge"** to merge your changes into `main`. This will automatically trigger the CI/CD pipeline.',
        hint: "Go to the PRs tab and merge your PR",
        action: "merge-pr",
        validate: (state) => state.pullRequests.some((pr) => pr.branch === "feature/story-108" && pr.status === "merged"),
        position: "bottom-right",
    },
    {
        id: "pipeline-running",
        tab: "cicd",
        title: "The CI/CD Pipeline",
        description:
            "Your merge triggered the CI/CD pipeline automatically. Watch as it runs through the stages:\n\n1. **Lint** — checks code style and syntax\n2. **Test** — runs automated test suites\n3. **Build** — compiles and containerizes the app\n4. **Deploy Dev** — deploys to the development environment\n5. **Deploy Acc** — deploys to acceptance/staging\n6. **Deploy Prod** — deploys to production (requires approval)\n\nClick on each stage to see its logs. If any stage fails, the pipeline stops.",
        action: "continue",
        position: "top",
    },
    {
        id: "watch-pipeline",
        tab: "cicd",
        title: "Watch the Stages",
        description:
            "Click on the individual stage nodes to see the logs streaming in real time.\n\nNotice how each stage depends on the previous one — this is a **sequential pipeline**. Some teams run stages in parallel (e.g., lint and test at the same time) to save time.\n\nWait for the pipeline to finish, or click Continue to move on.",
        action: "wait-pipeline",
        validate: (state) => state.pipelineRuns.some((r) => r.status === "passed"),
        position: "bottom-right",
    },
    {
        id: "check-infra",
        tab: "infra",
        title: "Check the Infrastructure",
        description:
            "Switch to the Infrastructure tab. Here you can see the three environments your code was deployed to:\n\n- **Dev** — for developers to test against (1 replica)\n- **Acc** — for QA and stakeholders to validate (2 replicas)\n- **Prod** — the live environment serving real users (3 replicas)\n\nNotice the version numbers updated after the deployment. In a real setup, each environment has its own URL, resources, and monitoring.",
        action: "continue",
        position: "top",
    },
    {
        id: "yaml-config",
        tab: "cicd",
        title: "The Pipeline Configuration",
        description:
            'Head back to CI/CD and click the **"YAML Config"** toggle in the toolbar.\n\nThis shows the actual configuration file that defines the pipeline. In real projects, this file lives in your repository at `.github/workflows/ci-cd.yml`.\n\nEvery job, stage, and deployment rule is defined as code — this is called **Pipeline as Code** and it means your CI/CD configuration goes through the same review process as your application code.',
        action: "continue",
        position: "top",
    },
    {
        id: "complete",
        tab: null,
        title: "You Did It!",
        description:
            "Congratulations — you just completed a full software engineering workflow!\n\nHere's what you did:\n- Picked up a user story from the Agile board\n- Created a feature branch\n- Wrote code and committed changes\n- Resolved a merge conflict\n- Opened and merged a pull request\n- Watched CI/CD deploy through Dev, Acc, and Production\n- Inspected the infrastructure and pipeline config\n\nThis is exactly how professional engineering teams ship code every day. Feel free to explore the app on your own now!",
        action: "finish",
        position: "center",
    },
];

/* ── Tutorial Context ──────────────────────────────── */
const TutorialContext = createContext(null);

export function TutorialProvider({ children }) {
    const [active, setActive] = useState(false);
    const [stepIndex, setStepIndex] = useState(0);
    const [dismissed, setDismissed] = useState(false);

    const currentStep = active ? TUTORIAL_STEPS[stepIndex] : null;
    const totalSteps = TUTORIAL_STEPS.length;

    const start = useCallback(() => {
        setStepIndex(0);
        setActive(true);
        setDismissed(false);
    }, []);

    const next = useCallback(() => {
        if (stepIndex < TUTORIAL_STEPS.length - 1) {
            setStepIndex((i) => i + 1);
        } else {
            setActive(false);
        }
    }, [stepIndex]);

    const skip = useCallback(() => {
        setActive(false);
        setDismissed(true);
    }, []);

    const goToStep = useCallback((idx) => {
        setStepIndex(idx);
    }, []);

    return (
        <TutorialContext.Provider
            value={{ active, currentStep, stepIndex, totalSteps, start, next, skip, goToStep, dismissed }}
        >
            {children}
        </TutorialContext.Provider>
    );
}

export function useTutorial() {
    const ctx = useContext(TutorialContext);
    if (!ctx) throw new Error("useTutorial must be used within TutorialProvider");
    return ctx;
}
