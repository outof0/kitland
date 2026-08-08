const fs = require('node:fs');
const path = require('node:path');

const designPath = path.resolve(__dirname, '..', 'design', 'design.pen');
const document = JSON.parse(fs.readFileSync(designPath, 'utf8'));

function walk(node, visit) {
  if (!node || typeof node !== 'object') return;
  visit(node);
  if (Array.isArray(node.children)) node.children.forEach(child => walk(child, visit));
}

function findByName(node, name) {
  const result = [];
  walk(node, child => {
    if (child.name === name) result.push(child);
  });
  return result;
}

function setThemeValue(token, dark, light) {
  document.variables[token] = {
    type: 'color',
    value: [
      {value: dark, theme: {mode: 'dark'}},
      {value: light, theme: {mode: 'light'}},
    ],
  };
}

// Kitland uses a blue identity layer, while semantic colors remain semantic.
setThemeValue('on-faint', '#7C8596', '#6B7280');
setThemeValue('focus', '#93C5FD', '#2563EB');
setThemeValue('accent', '#BEF264', '#65A30D');
setThemeValue('danger-soft', '#450A0A', '#FEE2E2');
setThemeValue('text-secondary', '#9AA3B2', '#5A6474');
setThemeValue('text', '#EDEFF3', '#0F172A');
setThemeValue('info', '#38BDF8', '#0284C7');
setThemeValue('info-soft', '#082F49', '#E0F2FE');
setThemeValue('warning-soft', '#451A03', '#FEF3C7');

const toolScreens = document.children.filter(
  child =>
    child.type === 'frame' &&
    child.width === 1440 &&
    child.height === 900 &&
    ![
      'Tool Screen Template',
      'Kitland · Responsive tool system',
      'Kitland · Alert system',
      'AstryX × Kitland · Foundations',
      'AstryX × Kitland · Tool patterns',
      'AstryX × Kitland · Responsive handoff',
    ].includes(child.name),
);

let deduplicatedRailActions = 0;
for (const screen of toolScreens) {
  // Slightly narrower nav gives every tool more room at desktop widths.
  const main = findByName(screen, 'Main')[0];
  if (main) {
    main.x = 240;
    main.width = 1200;
  }

  for (const title of [...findByName(screen, 'Page Title'), ...findByName(screen, 'Tool Title')]) {
    title.fontFamily = '$font-display';
  }

  for (const search of findByName(screen, 'Header Search')) {
    search.width = 300;
    search.height = 40;
    search.cornerRadius = 10;
  }

  // Every icon-only command receives a reliable 44px target. Segmented controls
  // intentionally keep their compact, grouped hit area.
  walk(screen, node => {
    if (
      node.type === 'frame' &&
      /(?:Action|Copy|Save|Clear|Format|Minify|Convert|Diff|Split|Escape|Star) Btn$/i.test(
        node.name || '',
      )
    ) {
      node.width = 44;
      node.height = 44;
      node.cornerRadius = 10;
    }
    if (node.name === 'Action Rail') node.width = 60;
  });

  // A labelled action in the tool header is clearer than the same action repeated
  // as an unlabeled rail icon. Keep the rail for follow-up actions such as copy/save.
  const headerActions = new Set();
  walk(screen, node => {
    const match = typeof node.name === 'string' && node.name.match(/^Action (?!Sample$)(.+)$/);
    if (match) headerActions.add(match[1]);
  });
  for (const rail of findByName(screen, 'Action Rail')) {
    for (const action of headerActions) {
      const index = rail.children.findIndex(child => child.name === `${action} Wrap`);
      if (index === -1) continue;
      rail.children.splice(index, 1);
      const adjacentSeparator =
        rail.children[index]?.name === 'sep'
          ? index
          : rail.children[index - 1]?.name === 'sep'
            ? index - 1
            : -1;
      if (adjacentSeparator !== -1) rail.children.splice(adjacentSeparator, 1);
      deduplicatedRailActions += 1;
    }
  }
}

const template = document.children.find(child => child.name === 'Tool Screen Template');
const templateHeaderRight = template && findByName(template, 'Header Right')[0];
if (templateHeaderRight) {
  for (const screen of toolScreens) {
    const current = findByName(screen, 'Header Right')[0];
    if (!current) continue;
    let nextId = 0;
    const canonical = JSON.parse(JSON.stringify(templateHeaderRight));
    walk(canonical, node => {
      if (node.id) node.id = `HeaderRight${screen.id}${nextId++}`;
    });
    Object.keys(current).forEach(key => delete current[key]);
    Object.assign(current, canonical);
  }
}

const sidebar = document.children.find(child => child.name === 'Sidebar');
if (sidebar) {
  sidebar.width = 240;
  const brand = findByName(sidebar, 'Brand')[0];
  if (brand) {
    // The Kitland primary lockup is designed for a light surface. Keeping that
    // surface explicit avoids the reverse mark becoming invisible in light mode.
    brand.fill = '$bg-elevated';
    brand.layout = 'horizontal';
    brand.padding = [12, 16];
    brand.children = [
      {
        type: 'frame',
        id: 'KitlandLogoLockup',
        name: 'Kitland primary lockup (vector)',
        width: 144,
        height: 40,
        fill: '#FFFFFF',
        cornerRadius: 10,
        clip: true,
        layout: 'horizontal',
        gap: 6,
        padding: 8,
        alignItems: 'center',
        children: [
          {
            type: 'frame',
            id: 'KitlandMark',
            name: 'Kitland symbol',
            width: 24,
            height: 24,
            layout: 'none',
            children: [
              {
                type: 'rectangle',
                id: 'KitlandMarkTop',
                name: 'Kitland symbol top block',
                x: 2.25,
                y: 2.25,
                width: 8.625,
                height: 8.625,
                cornerRadius: 1.875,
                fill: '#2563EB',
              },
              {
                type: 'rectangle',
                id: 'KitlandMarkBottom',
                name: 'Kitland symbol bottom block',
                x: 2.25,
                y: 13.125,
                width: 8.625,
                height: 8.625,
                cornerRadius: 1.875,
                fill: '#2563EB',
              },
              {
                type: 'path',
                id: 'KitlandMarkTopWing',
                name: 'Kitland symbol top wing',
                x: 0,
                y: 0,
                width: 24,
                height: 24,
                geometry: 'M36 6h17c3 0 5 2 5 5v7c0 2-1 4-3 5L40 31h-4V6Z',
                viewBox: [0, 0, 64, 64],
                fill: '#2563EB',
              },
              {
                type: 'path',
                id: 'KitlandMarkBottomWing',
                name: 'Kitland symbol bottom wing',
                x: 0,
                y: 0,
                width: 24,
                height: 24,
                geometry: 'M36 33h4l15 8c2 1 3 3 3 5v7c0 3-2 5-5 5H36V33Z',
                viewBox: [0, 0, 64, 64],
                fill: '#2563EB',
              },
            ],
          },
          {
            type: 'path',
            id: 'KitlandWordmark',
            name: 'Kitland wordmark',
            width: 90,
            height: 24,
            geometry:
              'M2.910,-0.000 L9.098,-0.000 L9.098,-10.223 L13.875,-15.630 L24.495,-0.000 L31.710,-0.000 L18.045,-19.808 L31.477,-34.920 L23.835,-34.920 L14.557,-24.398 C12.727,-22.290 10.920,-20.183 9.098,-18.067 L9.098,-34.920 L2.910,-34.920 L2.910,-0.000 Z M34.711,-0.000 L40.621,-0.000 L40.621,-24.750 L34.711,-24.750 L34.711,-0.000 Z M37.666,-28.432 C39.683,-28.432 41.206,-29.880 41.206,-31.807 C41.206,-33.705 39.683,-35.160 37.666,-35.160 C35.648,-35.160 34.126,-33.705 34.126,-31.807 C34.126,-29.880 35.648,-28.432 37.666,-28.432 Z M58.925,-24.750 L53.885,-24.750 L53.885,-31.500 L47.952,-31.500 L47.952,-24.750 L43.640,-24.750 L43.640,-19.995 L47.952,-19.995 L47.952,-6.232 C47.952,-1.995 50.322,-0.000 55.362,-0.000 L58.925,-0.000 L58.925,-4.755 L56.390,-4.755 C54.470,-4.755 53.885,-5.348 53.885,-7.103 L53.885,-19.995 L58.925,-19.995 L58.925,-24.750 Z M68.558,-34.920 L62.648,-34.920 L62.648,-0.000 L68.558,-0.000 L68.558,-34.920 Z M81.350,0.397 C85.385,0.397 87.470,-1.290 88.640,-3.495 L88.737,-3.495 L88.737,-0.000 L94.550,-0.000 L94.550,-16.875 C94.550,-22.035 90.725,-25.245 84.282,-25.245 C77.810,-25.245 73.782,-21.982 73.497,-17.062 L79.197,-17.062 C79.362,-19.148 81.282,-20.648 84.162,-20.648 C86.997,-20.648 88.685,-19.148 88.685,-17.040 L88.685,-16.852 C88.685,-15.165 87.117,-15.098 82.527,-14.580 C77.412,-14.040 72.800,-12.660 72.800,-7.035 C72.800,-2.085 76.430,0.397 81.350,0.397 Z M82.805,-3.982 C80.225,-3.982 78.560,-5.130 78.560,-7.080 C78.560,-9.330 80.720,-10.245 83.247,-10.620 C85.685,-10.995 87.987,-11.370 88.715,-11.835 L88.715,-9.165 C88.715,-6.285 86.675,-3.982 82.805,-3.982 Z M105.683,-13.995 C105.683,-18.210 108.001,-20.062 111.091,-20.062 C114.256,-20.062 116.086,-18.165 116.086,-14.535 L116.086,-0.000 L122.018,-0.000 L122.018,-15.473 C122.018,-21.817 118.358,-25.245 113.183,-25.245 C109.778,-25.245 107.273,-23.745 105.586,-20.955 L105.586,-24.750 L99.773,-24.750 L99.773,-0.000 L105.683,-0.000 L105.683,-13.995 Z M136.828,0.495 C140.061,0.495 142.783,-0.915 144.328,-3.772 L144.373,-3.772 L144.373,-0.000 L150.186,-0.000 L150.186,-34.920 L144.283,-34.920 L144.283,-21.232 L144.238,-21.232 C142.641,-23.955 139.993,-25.245 136.783,-25.245 C130.431,-25.245 126.118,-20.017 126.118,-12.397 C126.118,-4.688 130.363,0.495 136.828,0.495 Z M138.208,-4.455 C134.556,-4.455 132.096,-7.268 132.096,-12.397 C132.096,-17.505 134.556,-20.348 138.208,-20.348 C142.078,-20.348 144.613,-17.205 144.613,-12.397 C144.613,-7.567 142.078,-4.455 138.208,-4.455 Z',
            viewBox: [0.91, -37.16, 151.28, 39.65],
            fill: '#0F172A',
          },
        ],
      },
      {
        type: 'frame',
        id: 'KitlandNavToggle',
        name: 'Collapse Btn',
        width: 40,
        height: 40,
        fill: '$surface-low',
        cornerRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
        children: [
          {
            type: 'icon',
            id: 'KitlandNavToggleIcon',
            name: 'chevron-left',
            width: 18,
            height: 18,
            icon: 'chevron-left',
            library: 'lucide',
            fill: '$on-muted',
          },
        ],
      },
    ];
  }
}

function updateScreenText(screen, replacements) {
  walk(screen, node => {
    if (node.type !== 'text' || typeof node.content !== 'string') return;
    for (const [from, to] of replacements) {
      if (node.content === from) node.content = to;
    }
  });
}

const dateCalculator = toolScreens.find(screen => screen.name === 'Date Calculator');
if (dateCalculator) {
  updateScreenText(dateCalculator, [
    ['Pretty-print or compress JSON in one click', 'Add or subtract time from a date with timezone-aware results'],
  ]);
}

const regexTester = toolScreens.find(screen => screen.name === 'Regex Tester');
if (regexTester) {
  updateScreenText(regexTester, [['\bw+@w+.w+\b', '\\b\\w+@\\w+\\.\\w+\\b']]);
}

const jwt = toolScreens.find(screen => screen.name === 'JWT Decoder');
if (jwt) {
  walk(jwt, node => {
    if (node.type !== 'text' || typeof node.content !== 'string') return;
    const replacements = {
      Verified: 'Not verified',
      'valid sig': 'signature unverified',
      '3 parts  •  HS256  •  signature valid': '3 parts  •  HS256  •  signature unverified',
      Valid: 'Decoded only',
      Verify: 'Verify with key',
      'Decode JWT payloads': 'Inspect JWT claims; verify only with a supplied key',
      'Paste a JWT (HS/RS/ES) to inspect its 3 parts. Decoding needs no secret.':
        'Paste a JWT to inspect its 3 parts. Decoding does not verify its signature.',
    };
    if (replacements[node.content]) node.content = replacements[node.content];
    if (node.name === 'vt' || node.name === 'l' && node.content === 'Decoded only') node.fill = '$warning';
  });
}

const aes = toolScreens.find(screen => screen.name === 'AES Cipher');
if (aes) {
  walk(aes, node => {
    if (node.type !== 'text' || typeof node.content !== 'string') return;
    const replacements = {
      'AES-256-CBC': 'AES-256-GCM',
      'MODE + KEY + IV': 'MODE + KEY + NONCE',
      IV: 'Nonce',
      'AES-256-CBC  •  base64  •  PKCS#7': 'AES-256-GCM  •  base64  •  authenticated',
      '128-bit block  •  IV prepended  •  reversible with key':
        'authenticated encryption  •  nonce included  •  reversible with key',
      'Anyone with the key + IV can decrypt. Transmit the IV alongside the ciphertext.':
        'Authenticated encryption: share the nonce with the ciphertext, never the key.',
      'Symmetric; same key decrypts. PBKDF2 option for passphrases.':
        'Authenticated and symmetric; use a key or derive one from a passphrase.',
      'Encrypt & decrypt AES-256': 'Encrypt & decrypt with authenticated AES-256-GCM',
    };
    if (replacements[node.content]) node.content = replacements[node.content];
  });
}

const basicAuth = toolScreens.find(screen => screen.name === 'Basic Auth Header');
if (basicAuth) {
  walk(basicAuth, node => {
    if (node.type === 'text' && node.content === 'Build Basic Auth headers') {
      node.content = 'Build Basic Auth headers — use only over HTTPS';
    }
  });
}

function text(id, name, content, x, y, size, fill = '$on-surface', weight = 'normal') {
  return {
    type: 'text',
    id,
    name,
    x,
    y,
    fill,
    content,
    fontFamily: '$font-ui',
    fontSize: size,
    fontWeight: weight,
  };
}

function panel(id, name, x, y, width, height, fill = '$surface') {
  return {
    type: 'frame',
    id,
    name,
    x,
    y,
    width,
    height,
    fill,
    cornerRadius: 16,
    stroke: '$outline',
    strokeWidth: 1,
    clip: true,
    layout: 'none',
    children: [],
  };
}

// A shared responsive contract for every tool. It keeps future implementation
// decisions explicit without duplicating 64 mobile artboards.
const responsive = {
  type: 'frame',
  id: 'KitlandResponsiveSystem',
  x: 0,
  y: 6860,
  name: 'Kitland · Responsive tool system',
  theme: {mode: 'dark'},
  clip: true,
  width: 1440,
  height: 900,
  fill: '$bg',
  layout: 'none',
  children: [],
};

responsive.children.push(
  text('ResponsiveEyebrow', 'Eyebrow', 'KITLAND · ASTRYX FOUNDATION', 32, 28, 12, '$primary-strong', '600'),
  {...text('ResponsiveTitle', 'Title', 'One responsive workflow for all 64 tools', 32, 50, 28, '$on-surface', '700'), fontFamily: '$font-display'},
  text('ResponsiveIntro', 'Intro', 'Input first. One primary action. Result, copy feedback and validation stay in the same place.', 32, 88, 14, '$on-muted'),
);

const desktop = panel('ResponsiveDesktop', 'Desktop · 1280+', 32, 136, 600, 616);
desktop.children.push(
  text('DesktopLabel', 'Label', 'Desktop · 1280+', 20, 18, 12, '$primary-strong', '600'),
  text('DesktopRule', 'Rule', 'Persistent SideNav · split workspace', 20, 39, 13, '$on-muted'),
  {type: 'frame', id: 'DesktopNav', name: 'SideNav', x: 20, y: 76, width: 128, height: 500, fill: '$bg-elevated', cornerRadius: 12, children: [
    text('DesktopBrand', 'Brand', 'Kitland', 14, 16, 14, '$on-surface', '700'),
    text('DesktopNavOne', 'Nav item', 'Format & validate', 14, 64, 11, '$on-muted'),
    text('DesktopNavTwo', 'Nav item', 'Encode & decode', 14, 94, 11, '$on-muted'),
    text('DesktopNavThree', 'Nav item', 'Crypto & security', 14, 124, 11, '$on-muted'),
  ]},
  {type: 'frame', id: 'DesktopHeader', name: 'TopNav', x: 164, y: 76, width: 416, height: 48, fill: '$surface-low', cornerRadius: 12, children: [
    text('DesktopSearch', 'Command trigger', 'Search tools or type a command…   ⌘K', 16, 15, 12, '$on-muted'),
  ]},
  {type: 'frame', id: 'DesktopInput', name: 'Input panel', x: 164, y: 140, width: 200, height: 436, fill: '$surface-low', cornerRadius: 12, stroke: '$outline', strokeWidth: 1, children: [
    text('DesktopInputTitle', 'Input title', 'Input', 16, 14, 13, '$on-surface', '600'),
    text('DesktopInputHint', 'Input hint', 'Paste or type', 16, 34, 11, '$on-muted'),
    text('DesktopInputContent', 'Input content', '{\n  "format": "json"\n}', 16, 76, 11, '$on-surface'),
  ]},
  {type: 'frame', id: 'DesktopOutput', name: 'Output panel', x: 380, y: 140, width: 200, height: 436, fill: '$surface-low', cornerRadius: 12, stroke: '$outline', strokeWidth: 1, children: [
    text('DesktopOutputTitle', 'Output title', 'Result', 16, 14, 13, '$on-surface', '600'),
    text('DesktopOutputHint', 'Output hint', 'Copied feedback lives here', 16, 34, 11, '$on-muted'),
  ]},
);

const tablet = panel('ResponsiveTablet', 'Tablet · 768–1279', 660, 136, 410, 616);
tablet.children.push(
  text('TabletLabel', 'Label', 'Tablet · 768–1279', 20, 18, 12, '$primary-strong', '600'),
  text('TabletRule', 'Rule', 'TopNav · controls in overflow', 20, 39, 13, '$on-muted'),
  {type: 'frame', id: 'TabletHeader', name: 'Mobile TopNav', x: 20, y: 76, width: 370, height: 48, fill: '$surface-low', cornerRadius: 12, children: [
    text('TabletMenu', 'Menu', '☰', 14, 13, 16, '$on-surface', '600'),
    text('TabletBrand', 'Brand', 'Kitland', 50, 15, 14, '$on-surface', '700'),
    text('TabletCommand', 'Command trigger', '⌘K', 318, 15, 13, '$primary-strong', '600'),
  ]},
  {type: 'frame', id: 'TabletOptions', name: 'Tool options', x: 20, y: 140, width: 370, height: 44, fill: '$surface-low', cornerRadius: 12, children: [
    text('TabletOptionsText', 'Options', 'Mode  ·  Indent  ·  More options', 16, 13, 12, '$on-muted'),
  ]},
  {type: 'frame', id: 'TabletInput', name: 'Input panel', x: 20, y: 200, width: 370, height: 176, fill: '$surface-low', cornerRadius: 12, stroke: '$outline', strokeWidth: 1, children: [
    text('TabletInputTitle', 'Input title', 'Input', 16, 14, 13, '$on-surface', '600'),
    text('TabletInputHint', 'Input hint', 'Input remains above result after the split collapses.', 16, 36, 11, '$on-muted'),
  ]},
  {type: 'frame', id: 'TabletOutput', name: 'Output panel', x: 20, y: 392, width: 370, height: 184, fill: '$surface-low', cornerRadius: 12, stroke: '$outline', strokeWidth: 1, children: [
    text('TabletOutputTitle', 'Output title', 'Result', 16, 14, 13, '$on-surface', '600'),
    text('TabletOutputHint', 'Output hint', 'Copy and export are labelled buttons, not rail icons.', 16, 36, 11, '$on-muted'),
  ]},
);

const mobile = panel('ResponsiveMobile', 'Mobile · <768', 1098, 136, 310, 616);
mobile.children.push(
  text('MobileLabel', 'Label', 'Mobile · <768', 20, 18, 12, '$primary-strong', '600'),
  text('MobileRule', 'Rule', 'Drawer nav · stacked workspace', 20, 39, 13, '$on-muted'),
  {type: 'frame', id: 'MobileHeader', name: 'Mobile header', x: 20, y: 76, width: 270, height: 48, fill: '$primary', cornerRadius: 12, children: [
    text('MobileMenu', 'Menu', '☰', 14, 13, 16, '#FFFFFF', '600'),
    text('MobileBrand', 'Brand', 'Kitland', 50, 15, 14, '#FFFFFF', '700'),
    text('MobileSearch', 'Search', '⌕', 236, 12, 17, '#FFFFFF', '600'),
  ]},
  {type: 'frame', id: 'MobileInput', name: 'Input panel', x: 20, y: 140, width: 270, height: 174, fill: '$surface-low', cornerRadius: 12, stroke: '$outline', strokeWidth: 1, children: [
    text('MobileInputTitle', 'Input title', 'Input', 16, 14, 13, '$on-surface', '600'),
    text('MobileInputHint', 'Input hint', 'Paste or type. Options open in a sheet.', 16, 38, 11, '$on-muted'),
  ]},
  {type: 'frame', id: 'MobileResult', name: 'Output panel', x: 20, y: 330, width: 270, height: 146, fill: '$surface-low', cornerRadius: 12, stroke: '$outline', strokeWidth: 1, children: [
    text('MobileResultTitle', 'Output title', 'Result', 16, 14, 13, '$on-surface', '600'),
    text('MobileResultHint', 'Output hint', 'Errors are inline, named and actionable.', 16, 38, 11, '$on-muted'),
  ]},
  {type: 'frame', id: 'MobileAction', name: 'Sticky primary action', x: 20, y: 500, width: 270, height: 52, fill: '$primary', cornerRadius: 12, children: [
    text('MobileActionText', 'Action label', 'Convert', 103, 16, 14, '#FFFFFF', '600'),
  ]},
);

responsive.children.push(desktop, tablet, mobile);
responsive.children.push(
  text('ResponsiveFoot', 'Accessibility rule', 'All states: 44px targets · visible focus · named error/success · action stays near its input.', 32, 792, 13, '$on-muted'),
  text('ResponsiveBreakpoints', 'Breakpoints', '1280+ split  |  768–1279 stacked  |  <768 sticky CTA', 32, 820, 13, '$primary-strong', '600'),
);

// These preview cards are absolutely positioned compositions. Frames default to
// horizontal flex in .pen, which would otherwise ignore the x/y coordinates.
walk(responsive, node => {
  if (node.type === 'frame' && node.layout == null) node.layout = 'none';
});

function alertBanner(id, y, tone, icon, title, message, action) {
  const card = panel(`Alert${id}`, `${tone} banner`, 32, y, 860, 68, '$surface');
  card.cornerRadius = 8;
  card.stroke = '$outline';
  card.children.push(
    {type: 'rectangle', id: `Alert${id}Accent`, name: `${tone} accent`, x: 0, y: 0, width: 3, height: 68, cornerRadius: [8, 0, 0, 8], fill: `$${tone}`},
    {
      type: 'icon',
      id: `Alert${id}Icon`,
      name: `${tone} icon`,
      x: 16,
      y: 22,
      width: 18,
      height: 18,
      icon,
      library: 'lucide',
      fill: `$${tone}`,
    },
    text(`Alert${id}Title`, 'Alert title', title, 48, 12, 13, '$on-surface', '600'),
    {
      ...text(`Alert${id}Message`, 'Alert message', message, 48, 33, 12, '$on-muted'),
      width: 630,
      textGrowth: 'fixed-width',
    },
    text(`Alert${id}ActionText`, 'Alert action', action, 718, 26, 12, '$primary', '600'),
  );
  return card;
}

function toast(id, y, tone, icon, title, message) {
  const card = panel(`Toast${id}`, `${tone} toast`, 944, y, 412, 72, '$surface');
  card.cornerRadius = 8;
  card.children.push(
    {type: 'icon', id: `Toast${id}Icon`, name: `${tone} icon`, x: 16, y: 17, width: 18, height: 18, icon, library: 'lucide', fill: `$${tone}`},
    text(`Toast${id}Title`, 'Toast title', title, 48, 12, 13, '$on-surface', '600'),
    {...text(`Toast${id}Message`, 'Toast message', message, 48, 32, 12, '$on-muted'), width: 290, textGrowth: 'fixed-width'},
    {type: 'icon', id: `Toast${id}Close`, name: 'Dismiss toast', x: 378, y: 16, width: 16, height: 16, icon: 'x', library: 'lucide', fill: '$on-muted'},
  );
  return card;
}

const alerts = {
  type: 'frame',
  id: 'KitlandAlertSystem',
  x: 0,
  y: 6860,
  name: 'AstryX × Kitland · Foundations',
  reusable: true,
  theme: {mode: 'dark'},
  clip: true,
  width: 1440,
  height: 900,
  fill: '$bg',
  layout: 'none',
  children: [
    {...text('AlertTitle', 'Title', 'Feedback', 32, 32, 22, '$on-surface', '700'), fontFamily: '$font-display'},
    text('AlertIntro', 'Intro', 'Banner for persistent context. Toast for short-lived outcomes. Keep recovery actions close to the message.', 32, 62, 13, '$on-muted'),
    text('AlertBannerLabel', 'Section label', 'BANNERS', 32, 110, 11, '$on-faint', '600'),
    alertBanner('Info', 132, 'info', 'info', 'Local processing', 'Your input stays in this browser. No data is sent to a server.', 'Learn more'),
    alertBanner('Success', 216, 'success', 'circle-check', 'JSON is valid', '12 keys parsed successfully. You can format, copy or export the result.', 'View result'),
    alertBanner('Warning', 300, 'warning', 'triangle-alert', 'Large input may take longer', 'This file has 4.8 MB of text. Keep this tab open while it is processed.', 'Continue'),
    alertBanner('Error', 384, 'error', 'circle-alert', 'Could not parse line 4', 'Expected a comma after "name". Fix the input, then try formatting again.', 'Go to error'),
    text('AlertInlineLabel', 'Section label', 'INLINE VALIDATION', 32, 492, 11, '$on-faint', '600'),
    {
      type: 'frame', id: 'AlertInline', name: 'Inline error alert', x: 32, y: 514, width: 860, height: 82, fill: '$surface', stroke: '$error', strokeWidth: 1, cornerRadius: 8, layout: 'none', children: [
        {type: 'icon', id: 'AlertInlineIcon', name: 'Error icon', x: 16, y: 17, width: 18, height: 18, icon: 'circle-alert', library: 'lucide', fill: '$error'},
        text('AlertInlineTitle', 'Error label', 'Input has one error', 48, 14, 13, '$on-surface', '600'),
        {...text('AlertInlineMessage', 'Error description', 'Line 4, column 18: add a comma between adjacent object properties.', 48, 35, 12, '$on-muted'), width: 620, textGrowth: 'fixed-width'},
        text('AlertInlineActionText', 'Go to field action', 'Go to line 4', 730, 28, 12, '$primary', '600'),
      ],
    },
    text('AlertToastLabel', 'Section label', 'TOASTS', 944, 110, 11, '$on-faint', '600'),
    toast('Copied', 132, 'success', 'copy-check', 'Copied to clipboard', 'The formatted JSON is ready to paste.'),
    toast('Failed', 220, 'error', 'circle-alert', 'Export failed', 'Try again or copy the result manually.'),
    toast('Update', 308, 'info', 'info', 'New tool available', 'JSON → TypeScript was added to your favorites.'),
    text('AlertA11y', 'Accessibility note', 'All feedback is named, has an icon, and keeps its recovery action in context.', 32, 650, 13, '$on-muted'),
    text('ControlsLabel', 'Section label', 'CONTROLS', 32, 704, 11, '$on-faint', '600'),
    {type: 'frame', id: 'FoundationPrimaryButton', name: 'Primary Button', x: 32, y: 728, width: 112, height: 40, fill: '$primary', cornerRadius: 8, layout: 'none', children: [text('FoundationPrimaryButtonLabel', 'Button label', 'Run tool', 25, 11, 13, '#FFFFFF', '600')]},
    {type: 'frame', id: 'FoundationSecondaryButton', name: 'Secondary Button', x: 156, y: 728, width: 112, height: 40, fill: '$surface', stroke: '$outline', strokeWidth: 1, cornerRadius: 8, layout: 'none', children: [text('FoundationSecondaryButtonLabel', 'Button label', 'Clear', 34, 11, 13, '$on-surface', '600')]},
    {type: 'frame', id: 'FoundationInput', name: 'Text Input', x: 280, y: 728, width: 280, height: 40, fill: '$surface', stroke: '$outline', strokeWidth: 1, cornerRadius: 8, layout: 'none', children: [text('FoundationInputValue', 'Input value', 'Paste or type…', 12, 11, 13, '$on-faint')]},
    {type: 'frame', id: 'FoundationSelector', name: 'Selector', x: 572, y: 728, width: 160, height: 40, fill: '$surface', stroke: '$outline', strokeWidth: 1, cornerRadius: 8, layout: 'none', children: [text('FoundationSelectorValue', 'Selector value', 'Auto detect', 12, 11, 13, '$on-surface'), {type: 'icon', id: 'FoundationSelectorIcon', name: 'Chevron', x: 132, y: 11, width: 16, height: 16, icon: 'chevron-down', library: 'lucide', fill: '$on-muted'}]},
    text('FoundationsNote', 'Foundation note', 'AstryX primitives, themed with Kitland tokens. Buttons are labelled; icon buttons are reserved for compact follow-up actions.', 32, 796, 12, '$on-muted'),
    text('FoundationFormLabel', 'Section label', 'FORM & NAVIGATION', 944, 464, 11, '$on-faint', '600'),
    {type: 'frame', id: 'FoundationTextArea', name: 'Text Area', x: 944, y: 488, width: 412, height: 72, fill: '$surface', stroke: '$outline', strokeWidth: 1, cornerRadius: 8, layout: 'none', children: [text('FoundationTextAreaValue', 'Text area value', 'Paste structured input…', 12, 12, 13, '$on-faint')]},
    {type: 'frame', id: 'FoundationTabs', name: 'Tab List', x: 944, y: 580, width: 270, height: 36, fill: '$surface-low', cornerRadius: 8, padding: 2, layout: 'none', children: [{type: 'frame', id: 'FoundationTabActive', name: 'Active tab', x: 2, y: 2, width: 82, height: 32, fill: '$surface', cornerRadius: 6, layout: 'none', children: [text('FoundationTabActiveLabel', 'Tab label', 'Input', 22, 8, 12, '$on-surface', '600')]}, text('FoundationTabOutput', 'Tab label', 'Output', 102, 10, 12, '$on-muted', '600'), text('FoundationTabTree', 'Tab label', 'Tree', 192, 10, 12, '$on-muted', '600')]},
    {type: 'frame', id: 'FoundationIconButton', name: 'Icon Button', x: 1230, y: 578, width: 40, height: 40, fill: '$surface', stroke: '$outline', strokeWidth: 1, cornerRadius: 8, layout: 'none', children: [{type: 'icon', id: 'FoundationIconButtonIcon', name: 'Copy', x: 11, y: 11, width: 18, height: 18, icon: 'copy', library: 'lucide', fill: '$on-muted'}]},
    {...text('FoundationInteractionNote', 'Interaction note', 'Tooltip, Popover, Dialog and AlertDialog retain Astryx behavior; Kitland only supplies theme tokens and copy.', 944, 642, 12, '$on-muted'), width: 412, textGrowth: 'fixed-width'},
  ],
};

const patternSpecs = [
  ['01', 'Formatter & converter', 'Input → options → result. Split only when comparison matters.', 'Beautify / Minify · JSON Diff · HTML → JSX · JSON → YAML · YAML → JSON · JSON → CSV · JSON → TOML · XML Formatter · SQL Formatter · Markdown Preview · JSON → TypeScript · JSON → JS / const · JSON Toolbox · cURL Converter'],
  ['02', 'Encoder & text transform', 'Source → direction selector → output. Preserve source until cleared.', 'JSON Escape · Split → Newlines · Base64 · URL Encode · HTML Entities · Case Converter · Sort Lines · Dedupe Lines · Hex Text · Unicode Converter · Binary Text · ROT13 Caesar · Morse Code · Number Base · Text Reverser · Text Diff'],
  ['03', 'Security & identity', 'Sensitive input → explicit action → masked or copyable result.', 'Hash (SHA) · UUID / ID · JWT Decoder · HMAC Generator · AES Cipher · Bcrypt Hash · Token Generator · RSA Key Pair · Basic Auth Header · Password Generator · NanoID Generator · ULID Generator · ObjectID Generator'],
  ['04', 'Lookup & validation', 'One query → structured facts. Put the primary answer first.', 'Regex Tester · URL Parser · HTTP Status Codes · MIME Types · User Agent Parser · Cron Parser · IP Subnet Calculator · Text Stats'],
  ['05', 'Generator', 'Settings → generate → copy. History is secondary.', 'Lorem Ipsum · Mock Data · Random Port · Random Number · QR Code'],
  ['06', 'Time & utilities', 'Parameters → primary result → derived values with unit and locale.', 'Unix Timestamp · Date Calculator · Timezone Converter · Duration Formatter · Color Converter · Temperature · Data Size · Age Calculator'],
];

const patterns = {
  type: 'frame', id: 'KitlandToolPatterns', x: 1560, y: 6860,
  name: 'AstryX × Kitland · Tool patterns', theme: {mode: 'dark'}, clip: true,
  width: 1440, height: 900, fill: '$bg', layout: 'none', children: [
    text('PatternsEyebrow', 'Eyebrow', 'ASTRYX × KITLAND', 32, 28, 11, '$primary-strong', '600'),
    {...text('PatternsTitle', 'Title', 'Six patterns cover every tool', 32, 48, 24, '$on-surface', '700'), fontFamily: '$font-display'},
    text('PatternsIntro', 'Intro', 'A tool changes its copy, inputs and validation — not its interaction model.', 32, 80, 13, '$on-muted'),
  ],
};
patternSpecs.forEach(([number, title, anatomy, included], index) => {
  const x = index % 2 === 0 ? 32 : 728;
  const y = 128 + Math.floor(index / 2) * 212;
  const card = panel(`Pattern${number}`, title, x, y, 650, 188, '$surface');
  card.cornerRadius = 8;
  card.children.push(
    text(`Pattern${number}Number`, 'Pattern number', number, 20, 18, 11, '$on-faint', '600'),
    {...text(`Pattern${number}Title`, 'Pattern title', title, 20, 38, 17, '$on-surface', '700'), fontFamily: '$font-display'},
    text(`Pattern${number}Anatomy`, 'Pattern anatomy', anatomy, 20, 66, 12, '$on-muted'),
    text(`Pattern${number}IncludedLabel`, 'Included label', 'INCLUDED TOOLS', 20, 102, 10, '$on-faint', '600'),
    {...text(`Pattern${number}Included`, 'Included tools', included, 20, 120, 11, '$on-muted'), width: 604, height: 48, textGrowth: 'fixed-width-height', lineHeight: 1.35},
  );
  patterns.children.push(card);
});
patterns.children.push(text('PatternsFoot', 'Pattern note', 'Each pattern has one representative tool screen as its detailed source of truth. Avoid one-off controls in an individual tool.', 32, 788, 12, '$on-muted'));

function responsiveSketch(id, x, width, label, subtitle, navMode, isDesktop, isMobile) {
  const card = panel(id, label, x, 128, width, 542, '$surface');
  card.cornerRadius = 8;
  const contentWidth = width - 32;
  card.children.push(
    text(`${id}Label`, 'Breakpoint label', label, 16, 15, 12, '$on-surface', '600'),
    text(`${id}Subtitle`, 'Breakpoint detail', subtitle, 16, 34, 11, '$on-muted'),
    {type: 'frame', id: `${id}TopNav`, name: 'TopNav', x: 16, y: 64, width: contentWidth, height: 40, fill: '$surface-low', cornerRadius: 6, layout: 'none', children: [text(`${id}NavMode`, 'Navigation mode', navMode, 14, 11, 12, '$on-surface', '600')]},
  );
  if (isDesktop) {
    card.children.push(
      {type: 'frame', id: `${id}Nav`, name: 'SideNav', x: 16, y: 120, width: 108, height: 404, fill: '$bg-elevated', cornerRadius: 6, layout: 'none', children: [text(`${id}NavText`, 'Nav label', 'Tools', 14, 14, 12, '$on-surface', '600')]},
      {type: 'frame', id: `${id}Input`, name: 'Input pane', x: 140, y: 120, width: 202, height: 404, fill: '$surface-low', stroke: '$outline', strokeWidth: 1, cornerRadius: 6, layout: 'none', children: [text(`${id}InputText`, 'Input label', 'Input', 14, 14, 12, '$on-surface', '600')]},
      {type: 'frame', id: `${id}Output`, name: 'Result pane', x: 356, y: 120, width: 218, height: 404, fill: '$surface-low', stroke: '$outline', strokeWidth: 1, cornerRadius: 6, layout: 'none', children: [text(`${id}OutputText`, 'Result label', 'Result', 14, 14, 12, '$on-surface', '600')]},
    );
  } else {
    card.children.push(
      {type: 'frame', id: `${id}Input`, name: 'Input pane', x: 16, y: 120, width: contentWidth, height: isMobile ? 196 : 178, fill: '$surface-low', stroke: '$outline', strokeWidth: 1, cornerRadius: 6, layout: 'none', children: [text(`${id}InputText`, 'Input label', 'Input', 14, 14, 12, '$on-surface', '600')]},
      {type: 'frame', id: `${id}Output`, name: 'Result pane', x: 16, y: isMobile ? 330 : 312, width: contentWidth, height: isMobile ? 120 : 212, fill: '$surface-low', stroke: '$outline', strokeWidth: 1, cornerRadius: 6, layout: 'none', children: [text(`${id}OutputText`, 'Result label', 'Result', 14, 14, 12, '$on-surface', '600')]},
    );
    if (isMobile) card.children.push({type: 'frame', id: `${id}Primary`, name: 'Sticky primary action', x: 16, y: 466, width: contentWidth, height: 42, fill: '$primary', cornerRadius: 8, layout: 'none', children: [text(`${id}PrimaryText`, 'Action label', 'Format', Math.floor(contentWidth / 2) - 22, 11, 13, '#FFFFFF', '600')]});
  }
  return card;
}

const responsiveHandoff = {
  type: 'frame', id: 'KitlandResponsiveHandoff', x: 3120, y: 6860,
  name: 'AstryX × Kitland · Responsive handoff', theme: {mode: 'dark'}, clip: true,
  width: 1440, height: 900, fill: '$bg', layout: 'none', children: [
    text('ResponsiveHandoffEyebrow', 'Eyebrow', 'RESPONSIVE CONTRACT', 32, 28, 11, '$primary-strong', '600'),
    {...text('ResponsiveHandoffTitle', 'Title', 'One editor pattern, three layouts', 32, 48, 24, '$on-surface', '700'), fontFamily: '$font-display'},
    text('ResponsiveHandoffIntro', 'Intro', 'All two-pane tools inherit this behavior. Other patterns retain the same navigation and action rules.', 32, 80, 13, '$on-muted'),
    responsiveSketch('HandoffDesktop', 32, 590, 'Desktop · 1280+', 'SideNav persists. Input and result share a workspace.', 'Tools  ·  Search  ·  Theme', true, false),
    responsiveSketch('HandoffTablet', 650, 430, 'Tablet · 768–1279', 'SideNav becomes a drawer. Input stacks above result.', '☰  ·  Tool name  ·  More', false, false),
    responsiveSketch('HandoffMobile', 1108, 300, 'Mobile · <768', 'Drawer navigation. The primary action is sticky and labelled.', '☰  ·  Tool name', false, true),
    text('ResponsiveStateLabel', 'State label', 'REQUIRED STATES', 32, 716, 11, '$on-faint', '600'),
    text('ResponsiveStateText', 'State text', 'Empty · editing · processing · valid result · inline error · copy confirmation · disabled action', 32, 742, 13, '$on-muted'),
    text('ResponsiveAccessibilityText', 'Accessibility text', 'Keep keyboard focus visible. Return focus to the affected input after an error recovery action.', 32, 774, 13, '$on-muted'),
  ],
};

document.children = document.children.filter(
  child => child.id !== responsive.id && child.id !== alerts.id && child.id !== patterns.id && child.id !== responsiveHandoff.id,
);
document.children.push(alerts);
document.children.push(patterns);
document.children.push(responsiveHandoff);

fs.writeFileSync(designPath, `${JSON.stringify(document, null, 2)}\n`);
console.log(
  `Updated ${toolScreens.length} tool screens, deduplicated ${deduplicatedRailActions} rail actions, and refreshed the shared Kitland shell.`,
);
