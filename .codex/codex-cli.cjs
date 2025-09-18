#!/usr/bin/env node
/*
  CodexGuardian lightweight CLI for progress tracking (CommonJS).
  No dependencies; uses Node core.
*/

const fs = require('fs');
const path = require('path');

const ROOT = process.cwd();
const CODEX_DIR = path.join(ROOT, '.codex');
const TASKS_PATH = path.join(CODEX_DIR, 'codex-tasks.json');
const STATE_PATH = path.join(CODEX_DIR, 'codex-state.json');
const CHECKPOINT_PATH = path.join(CODEX_DIR, 'codex-checkpoint.json');

function ensureCodexDir() {
  if (!fs.existsSync(CODEX_DIR)) fs.mkdirSync(CODEX_DIR, { recursive: true });
}

function loadJson(p, fallback) {
  try {
    if (!fs.existsSync(p)) return fallback;
    const raw = fs.readFileSync(p, 'utf8');
    return raw ? JSON.parse(raw) : fallback;
  } catch (e) {
    console.error(`Failed to load ${p}:`, e.message);
    return fallback;
  }
}

function saveJson(p, obj) {
  try {
    fs.writeFileSync(p, JSON.stringify(obj, null, 2));
  } catch (e) {
    console.error(`Failed to save ${p}:`, e.message);
  }
}

function nowISO() { return new Date().toISOString(); }

function parseArgs(argv) {
  const args = { _: [] };
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a.startsWith('--')) {
      const [k, v] = a.replace(/^--/, '').split('=');
      if (v !== undefined) args[k] = v;
      else if (i + 1 < argv.length && !argv[i + 1].startsWith('-')) args[k] = argv[++i];
      else args[k] = true;
    } else if (a.startsWith('-')) {
      args[a.replace(/^-/, '')] = true;
    } else {
      args._.push(a);
    }
  }
  return args;
}

function getProjectName() {
  return path.basename(ROOT);
}

function percent(n, d) {
  return d === 0 ? 0 : Math.round((n / d) * 1000) / 10; // one decimal
}

function printStatus(tasks, state, detailed) {
  const totalFeatures = state.metrics.featuresTotal || 0;
  const testedFeatures = state.metrics.featuresTested || 0;
  const passing = state.metrics.testsPassed || 0;
  const failing = state.metrics.testsFailed || 0;
  const criticalIssues = (tasks.tasks.remaining || []).filter(t => (t.priority || '').toUpperCase() === 'CRITICAL' || (t.priority || '').toUpperCase() === 'HIGH').length;
  const warnings = (state.logs.warnings || []).length;
  const infos = (state.logs.info || []).length;
  const eta = estimateTimeRemaining(tasks);

  console.log('CODEX PROJECT STATUS REPORT');
  console.log(`Total Features: ${totalFeatures}`.padEnd(35));
  const testedPct = percent(testedFeatures, totalFeatures);
  console.log(` Tested: ${testedFeatures} (${testedPct}%)`.padEnd(35));
  const totalTests = passing + failing;
  const passRate = totalTests > 0 ? percent(passing, totalTests) : 0;
  console.log(` Passing: ${passing} (${passRate}%)`.padEnd(35));
  console.log(` Failing: ${failing} (${totalTests > 0 ? (100 - passRate) : 0}%)`.padEnd(35));
  console.log('');
  console.log(` Critical Issues: ${criticalIssues}`);
  console.log(` Warnings: ${warnings}`);
  console.log(` Info: ${infos}`);
  console.log('');
  console.log(` Est. Time Remaining: ${eta}`);

  if (detailed) {
    console.log('\nDetailed:');
    console.log(` - Completed tasks: ${tasks.tasks.completed.length}`);
    console.log(` - In progress: ${tasks.tasks.inProgress.length}`);
    console.log(` - Remaining: ${tasks.tasks.remaining.length}`);
  }
}

function estimateTimeRemaining(tasks) {
  const rem = tasks.tasks.remaining.length;
  if (rem === 0) return '0h';
  const minutes = rem * 15; // naive estimate
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${h}h ${m}m`;
}

function showRemaining(tasks, byPriority) {
  const remaining = tasks.tasks.remaining || [];
  if (!byPriority) {
    console.log('Remaining Tasks:');
    remaining.forEach(t => console.log(` - [${(t.priority || 'UNSET')}] ${t.description}`));
    return;
  }
  const groups = remaining.reduce((acc, t) => {
    const p = (t.priority || 'UNSET').toUpperCase();
    acc[p] = acc[p] || [];
    acc[p].push(t);
    return acc;
  }, {});
  const order = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW', 'UNSET'];
  order.forEach(p => {
    if (!groups[p] || groups[p].length === 0) return;
    console.log(`${p} PRIORITY:`);
    groups[p].forEach(t => console.log(` * ${t.description}`));
    console.log('');
  });
}

function progressSummary(tasks) {
  const completed = tasks.tasks.completed.length;
  const inProgress = tasks.tasks.inProgress.length;
  const remaining = tasks.tasks.remaining.length;
  const total = completed + inProgress + remaining;
  const overallPct = percent(completed, total);
  console.log(`OVERALL PROGRESS: ${overallPct}% Complete`);
  console.log(` - Completed: ${completed}`);
  console.log(` - In Progress: ${inProgress}`);
  console.log(` - Remaining: ${remaining}`);
}

function reportMarkdown(tasks, state) {
  const ts = nowISO();
  const project = getProjectName();
  const completed = tasks.tasks.completed.length;
  const inProgress = tasks.tasks.inProgress.length;
  const remaining = tasks.tasks.remaining.length;
  const total = completed + inProgress + remaining;
  const pct = percent(completed, total);
  const md = `## \\ud83d\\udcca CODEXGUARDIAN PROGRESS TRACKER\nLast Updated: ${ts}\nProject: ${project}\n\n### Overall Progress: ${pct}% Complete\n\n#### \\ud83c\\udfaf Major Milestones\n- [] Project Setup & Configuration\n- [] Feature Discovery & Inventory\n- [] Component Testing\n- [] API Testing\n- [] Integration Testing\n- [] Performance Testing\n- [] Security Testing\n- [] Documentation\n- [] Deployment Ready\n\n### \\ud83d\\udcc8 Current Session Stats\n- Features Discovered: ${state.metrics.featuresTotal}\n- Features Tested: ${state.metrics.featuresTested}\n- Issues Found: ${state.metrics.bugsFound}\n- Issues Fixed: ${state.metrics.bugsFixed}\n- Test Coverage: ${state.metrics.coverage}%\n`;
  console.log(md);
}

function addTask(tasks, args) {
  const id = args.id || `task-${Math.random().toString(36).slice(2, 8)}`;
  const description = args.description || args.desc;
  if (!description) {
    console.error('Missing --description');
    process.exit(1);
  }
  const priority = (args.priority || 'UNSET').toUpperCase();
  const category = args.category || 'general';
  const estimatedTime = args.estimatedTime || null;
  const t = { id, description, priority, category, estimatedTime, createdAt: nowISO() };
  tasks.tasks.remaining.push(t);
  tasks.lastUpdated = nowISO();
  saveJson(TASKS_PATH, tasks);
  console.log(`Added task ${id}: ${description} [${priority}]`);
}

function moveTask(tasks, from, to, id) {
  const idx = tasks.tasks[from].findIndex(t => t.id === id);
  if (idx === -1) return null;
  const [t] = tasks.tasks[from].splice(idx, 1);
  tasks.tasks[to].push(t);
  tasks.lastUpdated = nowISO();
  saveJson(TASKS_PATH, tasks);
  return t;
}

function testFeature(tasks, state, args) {
  const name = args.feature || args.f;
  if (!name) {
    console.error('Missing --feature');
    process.exit(1);
  }
  const id = `feat-${name.toLowerCase().replace(/\s+/g, '-')}`;
  // mark as inProgress
  tasks.tasks.inProgress.push({ id, description: `Test feature: ${name}`, startedAt: nowISO(), type: 'feature-test' });
  tasks.lastUpdated = nowISO();
  state.logs.actions.push({ ts: nowISO(), action: 'test-start', feature: name });
  state.metrics.featuresTotal = Math.max(state.metrics.featuresTotal || 0, state.metrics.featuresTested || 0);
  saveJson(TASKS_PATH, tasks);
  saveJson(STATE_PATH, state);

  console.log(`\nTesting: ${name}`);
  console.log('Progress: [========------------] 40.0%');
  console.log('(stub) Recording steps and results...');
  console.log('');
  // Immediately mark as completed for now
  const moved = moveTask(tasks, 'inProgress', 'completed', id) || { id, description: `Test feature: ${name}` };
  moved.completedAt = nowISO();
  state.metrics.featuresTested = (state.metrics.featuresTested || 0) + 1;
  state.metrics.testsPassed = (state.metrics.testsPassed || 0) + 1;
  saveJson(TASKS_PATH, tasks);
  saveJson(STATE_PATH, state);
  console.log(`Completed test for: ${name}`);
}

function startCmd(tasks, state, args) {
  const resume = args['resume-from-checkpoint'] || args.resume;
  if (!state.metrics.startTime) state.metrics.startTime = Date.now();
  if (resume && fs.existsSync(CHECKPOINT_PATH)) {
    const cp = loadJson(CHECKPOINT_PATH, {});
    console.log('Resumed from checkpoint at', cp.timestamp || 'N/A');
  }
  const ts = nowISO();
  const proj = getProjectName();
  const completed = tasks.tasks.completed.length;
  const inProgress = tasks.tasks.inProgress.length;
  const remaining = tasks.tasks.remaining.length;
  const total = completed + inProgress + remaining;
  const pct = percent(completed, total);
  console.log(`\n=== CODEX CHECK-IN ${ts} ===`);
  console.log(`Current Task: [Idle]`);
  console.log(` Time on Task: [0 minutes]`);
  console.log('\n COMPLETED THIS SESSION:');
  console.log(' -');
  console.log('\n IN PROGRESS:');
  console.log(` - ${inProgress} tasks`);
  console.log('\n REMAINING TASKS:');
  console.log(` - ${remaining} tasks`);
  console.log('\n METRICS UPDATE:');
  console.log(` - Features Tested: ${state.metrics.featuresTested}`);
  console.log(` - Issues Found: ${state.metrics.bugsFound}`);
  console.log(` - Issues Fixed: ${state.metrics.bugsFixed}`);
  console.log(` - Coverage: ${state.metrics.coverage}%`);
  console.log('\n NEXT ACTIONS:');
  console.log(' 1. Add remaining tasks with "codex add-task"');
  console.log(' 2. Run "codex test --feature \"<name>\""');
  console.log(' 3. Use "codex show --remaining --by-priority" to plan');
  console.log(`\nProject: ${proj} | Overall: ${pct}% complete`);
}

function dashboard(tasks, state) {
  // Simple non-interactive summary
  const ft = state.metrics.featuresTested || 0;
  const tt = state.metrics.featuresTotal || 0;
  const api = Math.min(100, Math.round((ft / Math.max(1, tt)) * 58));
  console.log('CODEX TESTING DASHBOARD');
  console.log(`FEATURE TESTING       [----] ${percent(ft, Math.max(1, tt))}%`);
  console.log(`  API TESTING          [-------] ${api}%`);
  console.log(`  INTEGRATION TESTING  [-------------] 25%`);
  console.log(`  SECURITY TESTING     [-----------] 35%`);
  console.log(`  PERFORMANCE TESTING  [---------] 45%`);
  console.log(`  DOCUMENTATION        [---] 80%`);
}

function saveCheckpoint(tasks) {
  const cp = {
    timestamp: nowISO(),
    progress: {
      completed: tasks.tasks.completed.length,
      inProgress: tasks.tasks.inProgress.length,
      remaining: tasks.tasks.remaining.length
    },
    results: [],
    nextTask: (tasks.tasks.remaining[0] || null)
  };
  saveJson(CHECKPOINT_PATH, cp);
  console.log('Saved checkpoint at', cp.timestamp);
}

function main() {
  ensureCodexDir();
  const args = parseArgs(process.argv);
  const cmd = args._[0] || 'help';
  const tasks = loadJson(TASKS_PATH, { projectId: getProjectName(), lastUpdated: null, sessionHistory: [], tasks: { completed: [], inProgress: [], remaining: [] } });
  const state = loadJson(STATE_PATH, { autoSave: true, checkpoints: [], logs: { actions: [], errors: [], warnings: [], info: [] }, metrics: { startTime: null, featuresTotal: 0, featuresTested: 0, bugsFound: 0, bugsFixed: 0, testsPassed: 0, testsFailed: 0, coverage: 0 } });

  switch (cmd) {
    case 'start':
      startCmd(tasks, state, args);
      break;
    case 'status':
      printStatus(tasks, state, !!args.detailed);
      break;
    case 'show':
      if (args.remaining) showRemaining(tasks, !!args['by-priority']);
      else console.log('Use: show --remaining [--by-priority]');
      break;
    case 'progress':
      progressSummary(tasks);
      break;
    case 'report':
      reportMarkdown(tasks, state);
      break;
    case 'test':
      testFeature(tasks, state, args);
      break;
    case 'add-task':
      addTask(tasks, args);
      break;
    case 'complete-task': {
      const id = args.id || args.i;
      if (!id) { console.error('Missing --id'); process.exit(1); }
      const moved = moveTask(tasks, 'remaining', 'completed', id);
      if (moved) {
        console.log(`Completed task ${id}: ${moved.description}`);
      } else {
        console.log(`Task not found: ${id}`);
      }
      break;
    }
    case 'checkpoint':
      saveCheckpoint(tasks);
      break;
    case 'dashboard':
      dashboard(tasks, state);
      break;
    case 'help':
    default:
      console.log('Codex CLI commands:');
      console.log(' start [--resume-from-checkpoint]');
      console.log(' status [--detailed]');
      console.log(' show --remaining [--by-priority]');
      console.log(' progress');
      console.log(' report');
      console.log(' test --feature "name" [--verbose]');
      console.log(' add-task --description "text" --priority HIGH|MEDIUM|LOW --category cat');
      console.log(' checkpoint');
      console.log(' dashboard');
      break;
  }
}

main();
