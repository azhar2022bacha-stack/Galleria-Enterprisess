import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const ts = require('typescript');
const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(scriptDir, '..');
const sourcePath = path.join(projectRoot, 'src/data/beautyCatalog.ts');
const source = await readFile(sourcePath, 'utf8');
const compiled = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
}).outputText;
const catalogModule = { exports: {} };
new Function('exports', 'require', 'module', compiled)(
  catalogModule.exports,
  require,
  catalogModule
);

const families = catalogModule.exports.BEAUTY_CATALOG_FAMILIES;
const outputDir = path.join(projectRoot, 'public/images/products/beauty');
await mkdir(outputDir, { recursive: true });

function escapeXml(value) {
  return String(value).replace(/[<>&"']/g, (char) => ({
    '<': '&lt;',
    '>': '&gt;',
    '&': '&amp;',
    '"': '&quot;',
    "'": '&apos;',
  })[char]);
}

function packageShape(type, hue, accentHue, index) {
  const body = `hsl(${hue} 54% 58%)`;
  const accent = `hsl(${accentHue} 61% 47%)`;
  const pale = `hsl(${hue} 55% 91%)`;
  const cap = `hsl(${(hue + 218) % 360} 16% 23%)`;
  const shift = index % 7;
  const label = `
    <rect x="404" y="455" width="216" height="176" rx="11" fill="#ffffff" fill-opacity=".9"/>
    <path d="M426 482h172" stroke="${accent}" stroke-width="4" stroke-linecap="round"/>
    <circle cx="512" cy="529" r="19" fill="${pale}" stroke="${accent}" stroke-width="3"/>
    <path d="M500 529h24M512 517v24" stroke="${accent}" stroke-width="3" stroke-linecap="round"/>
    <path d="M432 572h160M450 592h124" stroke="#667085" stroke-opacity=".58" stroke-width="4" stroke-linecap="round"/>`;

  const bottles = `
    <path d="M444 249q0-26 25-26h86q25 0 25 26v25h27v48h-20l20 42v375q0 43-42 43h-146q-42 0-42-43V364l20-42h-20v-48h27z" fill="url(#body)" stroke="#182230" stroke-opacity=".16" stroke-width="5"/>
    <rect x="470" y="176" width="80" height="77" rx="16" fill="url(#cap)"/>
    <path d="M465 361q0-17 17-17h105q17 0 17 17v355q0 33-33 33h-73q-33 0-33-33z" fill="#ffffff" fill-opacity=".14"/>
    ${label}
    <path d="M441 389q0 56 18 91" fill="none" stroke="#ffffff" stroke-opacity=".72" stroke-width="11" stroke-linecap="round"/>`;

  if (type === 0) return `
    <rect x="424" y="253" width="176" height="86" rx="19" fill="url(#cap)"/>
    <rect x="446" y="322" width="132" height="38" rx="12" fill="${accent}"/>
    <path d="M410 376q0-34 34-34h136q34 0 34 34v377q0 47-47 47h-110q-47 0-47-47z" fill="url(#body)" stroke="#182230" stroke-opacity=".2" stroke-width="5"/>
    <path d="M435 393h155v330q0 27-27 27h-101q-27 0-27-27z" fill="#ffffff" fill-opacity=".15"/>
    ${label}<path d="M441 406v258" stroke="#fff" stroke-opacity=".7" stroke-width="12" stroke-linecap="round"/>`;
  if (type === 1) return `
    <rect x="399" y="675" width="226" height="78" rx="24" fill="url(#cap)"/>
    <path d="M423 436q0-30 30-30h118q30 0 30 30v222q0 42-42 42h-94q-42 0-42-42z" fill="url(#body)" stroke="#182230" stroke-opacity=".18" stroke-width="5"/>
    <path d="M405 422q0-24 24-24h166q24 0 24 24v29H405z" fill="${pale}" stroke="#182230" stroke-opacity=".14" stroke-width="4"/>
    ${label}<path d="M450 484q0 69 12 112" fill="none" stroke="#fff" stroke-opacity=".68" stroke-width="10" stroke-linecap="round"/>`;
  if (type === 2 || type === 12) return `
    <rect x="420" y="213" width="185" height="114" rx="24" fill="url(#cap)"/>
    <path d="M448 321q0-24 26-24h79q26 0 26 24v30h28v374q0 46-46 46h-124q-46 0-46-46V351h28z" fill="url(#body)" stroke="#182230" stroke-opacity=".18" stroke-width="5"/>
    <path d="M446 382h158v324q0 30-30 30h-98q-30 0-30-30z" fill="#fff" fill-opacity=".13"/>
    ${label}<path d="M467 373v-32h100" fill="none" stroke="#fff" stroke-opacity=".72" stroke-width="9" stroke-linecap="round"/>`;
  if (type === 3 || type === 9 || type === 11) return `
    <path d="M478 246h71v91l55 33q20 12 18 36l-24 352q-3 40-43 40h-96q-40 0-43-40l-24-352q-2-24 18-36l54-33z" fill="url(#body)" stroke="#182230" stroke-opacity=".18" stroke-width="5"/>
    <rect x="467" y="196" width="93" height="66" rx="16" fill="url(#cap)"/>
    <path d="M443 391h168l-18 302q-2 27-30 27h-72q-28 0-30-27z" fill="#fff" fill-opacity=".15"/>
    ${label}<path d="M456 405l18 228" stroke="#fff" stroke-opacity=".7" stroke-width="10" stroke-linecap="round"/>`;
  if (type === 4) return `
    <rect x="469" y="190" width="94" height="93" rx="36" fill="url(#cap)"/>
    <path d="M435 273q0-21 22-21h118q22 0 22 21v62q0 17-16 26l-17 10v383q0 50-50 50h-5q-50 0-50-50V371l-17-10q-16-9-16-26z" fill="url(#body)" stroke="#182230" stroke-opacity=".18" stroke-width="5"/>
    ${label}<path d="M455 398v267" stroke="#fff" stroke-opacity=".68" stroke-width="10" stroke-linecap="round"/>`;
  if (type === 5) return `
    <rect x="455" y="188" width="114" height="82" rx="16" fill="url(#cap)"/>
    <path d="M473 266h78l18 57 67 55v339q0 56-56 56H444q-56 0-56-56V378l67-55z" fill="url(#body)" stroke="#182230" stroke-opacity=".22" stroke-width="6"/>
    <path d="M410 386l102 46 102-46v302q0 40-40 40h-124q-40 0-40-40z" fill="#fff" fill-opacity=".15"/>
    <path d="M512 431v293M412 388l100 43 100-43" fill="none" stroke="#fff" stroke-opacity=".6" stroke-width="7"/>
    ${label}`;
  if (type === 6) return `
    <path d="M455 449h114v339q0 30-30 30h-54q-30 0-30-30z" fill="url(#cap)"/>
    <rect x="438" y="414" width="148" height="53" rx="16" fill="${accent}"/>
    <path d="M458 415v-168q0-22 22-22h64q22 0 22 22v168z" fill="url(#body)" stroke="#182230" stroke-opacity=".18" stroke-width="5"/>
    <path d="M476 250q0-66 36-100 36 34 36 100v25h-72z" fill="${pale}" stroke="#182230" stroke-opacity=".18" stroke-width="5"/>
    <path d="M475 467v276" stroke="#fff" stroke-opacity=".52" stroke-width="8"/>
    ${label}`;
  if (type === 7) return `
    <rect x="366" y="346" width="295" height="426" rx="42" fill="url(#cap)" transform="rotate(-7 514 559)"/>
    <rect x="382" y="343" width="288" height="402" rx="38" fill="url(#body)" stroke="#182230" stroke-opacity=".2" stroke-width="5" transform="rotate(5 526 544)"/>
    <g transform="rotate(5 526 544)">
      <rect x="411" y="393" width="230" height="90" rx="18" fill="#fff" fill-opacity=".9"/>
      <circle cx="449" cy="551" r="31" fill="${pale}"/><circle cx="524" cy="551" r="31" fill="${accent}"/><circle cx="599" cy="551" r="31" fill="${cap}"/>
      <circle cx="449" cy="632" r="31" fill="${accent}"/><circle cx="524" cy="632" r="31" fill="${pale}"/><circle cx="599" cy="632" r="31" fill="#d6b5a1"/>
      <text x="526" y="451" text-anchor="middle" font-family="Arial,sans-serif" font-size="19" font-weight="700" fill="#182230">${escapeXml(families[index]?.brand ?? 'BEAUTY')}</text>
    </g>`;
  if (type === 8) return `
    <path d="M392 378q0-34 36-34h171q36 0 36 34v300q0 36-36 36H428q-36 0-36-36z" fill="${pale}" stroke="#182230" stroke-opacity=".16" stroke-width="5"/>
    <path d="M420 392v-65q0-27 26-27h132q26 0 26 27v65" fill="none" stroke="url(#cap)" stroke-width="19"/>
    <g stroke-linecap="round">
      <path d="M452 610l-14-250" stroke="${cap}" stroke-width="19"/><path d="M438 362l-30-95q-4-14 10-20l31-13q16-5 23 11l23 99z" fill="${accent}"/>
      <path d="M514 610v-285" stroke="${cap}" stroke-width="18"/><path d="M493 331q-14-63 5-101 17-25 34 0 19 38 5 101z" fill="${body}"/>
      <path d="M576 610l21-254" stroke="${cap}" stroke-width="19"/><path d="M589 356l22-93q4-15 20-10l30 11q14 7 9 22l-29 91z" fill="${accent}"/>
    </g>
    <rect x="408" y="635" width="204" height="73" rx="14" fill="#fff" fill-opacity=".92"/>
    <text x="510" y="681" text-anchor="middle" font-family="Arial,sans-serif" font-size="20" font-weight="700" fill="#182230">BRUSH SET</text>`;
  if (type === 10 || type === 13) return `
    <rect x="477" y="173" width="72" height="169" rx="15" fill="url(#cap)"/>
    <path d="M494 319h38v85h-38z" fill="${accent}"/>
    <path d="M421 408q0-25 25-25h130q25 0 25 25v358q0 49-49 49h-82q-49 0-49-49z" fill="url(#body)" stroke="#182230" stroke-opacity=".2" stroke-width="5"/>
    <path d="M443 443h136v295q0 32-32 32h-72q-32 0-32-32z" fill="#fff" fill-opacity=".16"/>
    ${label}<path d="M450 454v217" stroke="#fff" stroke-opacity=".68" stroke-width="10" stroke-linecap="round"/>`;
  if (type === 14) return `
    <path d="M398 301q0-30 30-30h74v59h-46q-12 0-12 13v284q0 32-32 32h-14z" fill="url(#cap)"/>
    <path d="M626 301q0-30-30-30h-74v59h46q12 0 12 13v284q0 32 32 32h14z" fill="url(#body)" stroke="#182230" stroke-opacity=".2" stroke-width="5"/>
    <rect x="475" y="322" width="74" height="480" rx="31" fill="url(#body)" stroke="#182230" stroke-opacity=".2" stroke-width="5"/>
    <rect x="492" y="369" width="40" height="335" rx="18" fill="#fff" fill-opacity=".25"/>
    <circle cx="512" cy="746" r="13" fill="${accent}"/><path d="M398 299h76M550 299h76" stroke="${accent}" stroke-width="18" stroke-linecap="round"/>`;
  return bottles;
}

function makeSvg(family, index) {
  const categoryIndex = Math.floor(index / 100);
  const hue = Math.round((index * 137.508 + 18) % 360);
  const accentHue = (hue + 43 + categoryIndex * 8) % 360;
  const brand = escapeXml(family.brand);
  const productLabel = escapeXml(family.title.split(' · ')[0].slice(0, 27));
  const shape = packageShape(categoryIndex, hue, accentHue, index);
  const typeLabel = escapeXml(family.subcategory.toUpperCase());

  return `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1024 1024" role="img" aria-label="Illustrative ${typeLabel} demo catalog artwork">
    <defs>
      <linearGradient id="body" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="hsl(${hue} 48% 83%)"/><stop offset=".42" stop-color="hsl(${hue} 63% 62%)"/><stop offset="1" stop-color="hsl(${hue} 53% 39%)"/></linearGradient>
      <linearGradient id="cap" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="hsl(${accentHue} 24% 24%)"/><stop offset=".55" stop-color="hsl(${accentHue} 26% 40%)"/><stop offset="1" stop-color="hsl(${accentHue} 22% 19%)"/></linearGradient>
      <filter id="shadow" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="24"/></filter>
    </defs>
    <ellipse cx="512" cy="865" rx="203" ry="32" fill="#172033" fill-opacity=".15" filter="url(#shadow)"/>
    <g transform="translate(0 ${index % 5 === 0 ? 5 : 0})">${shape}</g>
    <text x="512" y="850" text-anchor="middle" font-family="Arial,sans-serif" font-size="18" font-weight="700" letter-spacing="2" fill="#667085">${brand.slice(0, 36)}</text>
    <text x="512" y="882" text-anchor="middle" font-family="Arial,sans-serif" font-size="13" letter-spacing="1.5" fill="#98a2b3">ILLUSTRATIVE CATALOG ART · ${String(index + 1).padStart(4, '0')}</text>
    <title>${productLabel} — illustrative demo listing</title>
  </svg>`;
}

for (let index = 0; index < families.length; index += 1) {
  const filename = `beauty-${String(index + 1).padStart(4, '0')}.svg`;
  await writeFile(path.join(outputDir, filename), makeSvg(families[index], index), 'utf8');
}

console.log(`Generated ${families.length} unique transparent SVG product illustrations in ${outputDir}`);
