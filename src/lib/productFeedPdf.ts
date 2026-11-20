import { normalizeProductFeedHeader, REQUIRED_PRODUCT_FEED_COLUMNS } from '@/lib/productFeed';

type TextRun = { text: string; x: number; y: number; width: number };

const MAX_PAGES = 300;
const MAX_ROWS = 5000;
const REQUIRED_FIELDS = Object.values(REQUIRED_PRODUCT_FEED_COLUMNS);

function textLines(runs: TextRun[]): TextRun[][] {
  const lines: TextRun[][] = [];
  for (const run of runs.sort((a, b) => b.y - a.y || a.x - b.x)) {
    const lastLine = lines.at(-1);
    if (lastLine && Math.abs(lastLine[0].y - run.y) <= 2) lastLine.push(run);
    else lines.push([run]);
  }
  return lines.map((line) => line.sort((a, b) => a.x - b.x));
}

function headerCells(line: TextRun[]): TextRun[] {
  const cells: TextRun[] = [];
  for (const run of line) {
    const previous = cells.at(-1);
    if (previous && run.x <= previous.x + previous.width + 3) {
      previous.text += ' ' + run.text;
      previous.width = Math.max(previous.width, run.x + run.width - previous.x);
    } else {
      cells.push({ ...run });
    }
  }
  return cells;
}

export async function readProductPdf(file: File): Promise<string[][]> {
  const pdfjs = await import('pdfjs-dist');
  pdfjs.GlobalWorkerOptions.workerSrc = `/api/admin/product-feed/pdf-worker?v=${pdfjs.version}`;
  const task = pdfjs.getDocument({
    data: new Uint8Array(await file.arrayBuffer()),
    stopAtErrors: true,
    useWasm: false,
    disableFontFace: true,
  });
  const rows: string[][] = [];
  let headers: string[] = [];
  try {
    const document = await task.promise;
    if (document.numPages > MAX_PAGES) throw new Error(`Use a PDF with up to ${MAX_PAGES} pages.`);
    for (let pageNumber = 1; pageNumber <= document.numPages; pageNumber += 1) {
      const page = await document.getPage(pageNumber);
      const content = await page.getTextContent();
      const runs = content.items.flatMap((item) => 'str' in item && item.str.trim()
        ? [{ text: item.str.trim(), x: item.transform[4], y: item.transform[5], width: item.width }]
        : []);
      const lines = textLines(runs);
      let columns: TextRun[] | undefined;
      for (const line of lines) {
        const cells = headerCells(line);
        const labels = cells.map((cell) => normalizeProductFeedHeader(cell.text));
        if (REQUIRED_FIELDS.every((aliases) => aliases.some((alias) => labels.includes(alias)))) {
          if (headers.length && (labels.length !== headers.length || labels.some((label, index) => label !== headers[index]))) {
            throw new Error(`Use the same product columns in the same order on every page. Check page ${pageNumber}.`);
          }
          headers = labels;
          columns = cells;
          continue;
        }
        if (!columns || /^page \d+(?:\s+(?:of|\/)\s*\d+)?$/i.test(line.map((run) => run.text).join(' '))) continue;

        const row = columns.map(() => '');
        for (const run of line) {
          const lastColumn = columns.findLastIndex((column) => column.x - 3 <= run.x);
          const index = Math.max(0, lastColumn);
          row[index] = row[index] ? row[index] + ' ' + run.text : run.text;
        }
        rows.push(row);
        if (rows.length > MAX_ROWS) throw new Error('Upload no more than 5,000 products at a time.');
      }
      page.cleanup();
      if (!columns) {
        throw new Error(`Page ${pageNumber} needs a selectable product table with the required column headers. Export the table as text or use CSV.`);
      }
    }
  } finally {
    await task.destroy();
  }
  if (!rows.length) throw new Error('The PDF must include at least one product row.');
  return [headers, ...rows];
}
