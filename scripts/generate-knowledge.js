const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const outPath = path.join(root, 'src', 'components', 'generated-knowledge.json');

function readMdFiles() {
  const mdDir = root; // look at repo root for top-level md docs
  const files = fs.readdirSync(mdDir).filter(f => f.endsWith('.md'));
  const entries = files.map(f => {
    try {
      const content = fs.readFileSync(path.join(mdDir, f), 'utf8');
      const snippet = content.split('\n').slice(0, 8).join(' ').trim().replace(/\s+/g, ' ');
      const name = f.replace(/\.md$/i, '').replace(/[_-]/g, ' ');
      return {
        intent: name.charAt(0).toUpperCase() + name.slice(1),
        triggers: name.toLowerCase().split(/\W+/).filter(Boolean),
        answer: snippet || `See ${f} for details.`
      };
    } catch (e) {
      return null;
    }
  }).filter(Boolean);
  return entries;
}

function readComponents() {
  const dir = path.join(root, 'src', 'components');
  if (!fs.existsSync(dir)) return [];
  const files = fs.readdirSync(dir).filter(f => /\.(tsx|ts|jsx|js)$/.test(f));
  return files.map(f => {
    try {
      const content = fs.readFileSync(path.join(dir, f), 'utf8');
      const lines = content.split(/\r?\n/);
      // try to capture top comment block or first non-empty lines
      let snippet = '';
      for (let i = 0; i < Math.min(lines.length, 20); i++) {
        if (lines[i].trim().startsWith('//') || lines[i].trim().startsWith('/*') || lines[i].trim()) {
          snippet += lines[i].replace(/\/\*|\*\//g, '').replace(/\/\//g, '').trim() + ' ';
        }
        if (snippet.split(' ').length > 30) break;
      }
      const name = f.replace(/\.(tsx|ts|jsx|js)$/i, '');
      return { intent: `Component: ${name}`, triggers: name.toLowerCase().split(/\W+/).filter(Boolean), answer: snippet.trim().slice(0, 1000) || `See ${f}` };
    } catch (e) { return null; }
  }).filter(Boolean);
}

function readLib() {
  const dir = path.join(root, 'src', 'lib');
  if (!fs.existsSync(dir)) return [];
  const files = fs.readdirSync(dir).filter(f => /\.(ts|js)$/.test(f));
  return files.map(f => {
    try {
      const content = fs.readFileSync(path.join(dir, f), 'utf8');
      const lines = content.split(/\r?\n/);
      let snippet = '';
      for (let i = 0; i < Math.min(lines.length, 30); i++) {
        if (lines[i].trim()) { snippet += lines[i].trim() + ' '; }
        if (snippet.split(' ').length > 40) break;
      }
      const name = f.replace(/\.(ts|js)$/i, '');
      return { intent: `Lib: ${name}`, triggers: name.toLowerCase().split(/\W+/).filter(Boolean), answer: snippet.trim().slice(0, 1200) || `See ${f}` };
    } catch (e) { return null; }
  }).filter(Boolean);
}

function readPackage() {
  const pkgPath = path.join(root, 'package.json');
  if (!fs.existsSync(pkgPath)) return [];
  try {
    const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
    const deps = Object.keys(pkg.dependencies || {}).slice(0, 40).join(', ');
    return [{ intent: 'Project Dependencies', triggers: ['dependencies','packages','project'], answer: `This project lists the following dependencies: ${deps}` }];
  } catch (e) { return []; }
}

function readCustomQA() {
  const custom = path.join(root, 'scripts', 'custom-qa.json');
  if (!fs.existsSync(custom)) return [];
  try {
    const data = JSON.parse(fs.readFileSync(custom, 'utf8'));
    if (Array.isArray(data)) return data.map(d => ({ intent: d.intent || 'Custom', triggers: d.triggers || [], answer: d.answer || '' }));
    return [];
  } catch (e) { return []; }
}

function readAppRoutes() {
  const appDir = path.join(root, 'src', 'app');
  const entries = [];
  function walk(dir, routePrefix = '') {
    const items = fs.readdirSync(dir, { withFileTypes: true });
    let hasPage = false;
    for (const it of items) {
      if (it.isFile() && /^page\.(tsx|jsx|ts|js)$/.test(it.name)) {
        hasPage = true;
      }
    }
    if (hasPage) {
      const route = routePrefix || '/';
      entries.push({
        intent: `Page: ${route}`,
        triggers: route.replace(/\//g, ' ').split(/\W+/).filter(Boolean),
        answer: `This route corresponds to ${route}. Open the ${route} page in the site to view content.`
      });
    }
    for (const it of items) {
      if (it.isDirectory()) {
        const name = it.name;
        walk(path.join(dir, name), path.posix.join(routePrefix, name));
      }
    }
  }
  try {
    walk(appDir, '');
  } catch (e) {
    // no app dir
  }
  return entries;
}

function build() {
  const md = readMdFiles();
  const routes = readAppRoutes();
  const comps = readComponents();
  const libs = readLib();
  const pkg = readPackage();
  const custom = readCustomQA();
  // prefer custom QA first, then components, libs, md, routes, package
  const combined = [...custom, ...comps, ...libs, ...md, ...routes, ...pkg];
  fs.writeFileSync(outPath, JSON.stringify(combined, null, 2), 'utf8');
  console.log('generated knowledge entries:', combined.length);
}

build();
