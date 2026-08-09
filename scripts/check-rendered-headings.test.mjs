import assert from 'node:assert/strict';
import test from 'node:test';

import { inspectRenderedPage, matchesExclusion } from './check-rendered-headings.mjs';

test('accepts one H1, peer headings, and a return to a parent level', () => {
  const result = inspectRenderedPage(`
    <html><head></head><body>
      <h1>Moving insurance</h1>
      <h2>Cover</h2><h3>Details</h3><h2>Next steps</h2><h2>Questions</h2>
    </body></html>
  `);

  assert.deepEqual(result.failures, []);
});

test('rejects missing and duplicate H1 headings', () => {
  assert.match(inspectRenderedPage('<h2>Cover</h2>').failures.join('\n'), /exactly one/);
  assert.match(inspectRenderedPage('<h1>One</h1><h1>Two</h1>').failures.join('\n'), /exactly one/);
});

test('rejects empty headings and skipped levels', () => {
  const result = inspectRenderedPage('<h1>Title</h1><h2></h2><h2>Cover</h2><h4>Detail</h4>');
  assert.match(result.failures.join('\n'), /is empty/);
  assert.match(result.failures.join('\n'), /H2 to H4/);
});

test('requires the first visible heading to be H1', () => {
  const result = inspectRenderedPage('<h2>Early section</h2><h1>Page title</h1>');
  assert.match(result.failures.join('\n'), /first visible heading is H2/);
});

test('ignores headings hidden by their own or an ancestor attribute', () => {
  const result = inspectRenderedPage(`
    <div aria-hidden="true"><h1>Hidden duplicate</h1></div>
    <h1>Visible title</h1>
    <h2>Visible section</h2>
    <h3 hidden>Hidden empty heading</h3>
  `);
  assert.deepEqual(result.failures, []);
});

test('excludes rendered pages that declare noindex', () => {
  const result = inspectRenderedPage(
    '<meta name="robots" content="noindex, follow"><h2>Utility heading</h2>'
  );
  assert.equal(result.excluded, true);
  assert.equal(result.reason, 'noindex');
});

test('supports explicit utility-page exclusion patterns', () => {
  assert.equal(matchesExclusion('reports/internal/index.html', ['reports/*']), true);
  assert.equal(matchesExclusion('public/index.html', ['reports/*']), false);
});
