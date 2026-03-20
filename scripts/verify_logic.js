
const mockPRs = Array.from({ length: 30 }, (_, i) => ({
  repository_url: 'https://api.github.com/repos/owner/repo',
  number: i + 1,
}));

const DELAY = 100;

async function graphqlQueryMock() {
  await new Promise(resolve => setTimeout(resolve, DELAY));
  return {};
}

async function concurrentOptimized(items) {
  const batchSize = 20;
  const batchPromises = [];
  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    batchPromises.push(graphqlQueryMock().then(prData => ({ batch, prData })));
  }

  const allBatchResults = await Promise.all(batchPromises);

  let merged = 0;
  let leadTimes = [];
  let changes = [];
  let sizes = [];
  let comments = [];
  let issuesClosed = 0;

  for (const { batch, prData } of allBatchResults) {
    for (let idx = 0; idx < batch.length; idx++) {
      // Mock data extraction
      const pr = {
        mergedAt: '2024-01-02T00:00:00Z',
        createdAt: '2024-01-01T00:00:00Z',
        additions: 100,
        deletions: 50,
        comments: { totalCount: 5 },
        reviews: { nodes: [{ state: 'CHANGES_REQUESTED' }] },
        closingIssuesReferences: { totalCount: 1 },
      };

      if (pr.mergedAt) {
        merged += 1;
        const diff = new Date(pr.mergedAt).getTime() - new Date(pr.createdAt).getTime();
        leadTimes.push(diff / 36e5);
      }
      const changeReq = pr.reviews.nodes.filter(n => n.state === 'CHANGES_REQUESTED').length;
      changes.push(changeReq);
      sizes.push(pr.additions + pr.deletions);
      comments.push(pr.comments.totalCount);
      issuesClosed += pr.closingIssuesReferences.totalCount;
    }
  }

  return {
    merged,
    leadTimes,
    changes,
    sizes,
    comments,
    issuesClosed
  };
}

async function run() {
  console.log('Verifying concurrent logic with mock data...');
  const results = await concurrentOptimized(mockPRs);

  const expected = {
    merged: 30,
    issuesClosed: 30,
    avgSize: 150,
    avgComments: 5,
    avgChanges: 1,
    avgLeadTime: 24
  };

  let failed = false;
  if (results.merged !== expected.merged) {
    console.error(`Merged mismatch: expected ${expected.merged}, got ${results.merged}`);
    failed = true;
  }
  if (results.issuesClosed !== expected.issuesClosed) {
    console.error(`Issues closed mismatch: expected ${expected.issuesClosed}, got ${results.issuesClosed}`);
    failed = true;
  }

  const avg = (arr) => arr.reduce((a, b) => a + b, 0) / arr.length;

  if (avg(results.sizes) !== expected.avgSize) {
    console.error(`Avg size mismatch: expected ${expected.avgSize}, got ${avg(results.sizes)}`);
    failed = true;
  }
  if (avg(results.comments) !== expected.avgComments) {
    console.error(`Avg comments mismatch: expected ${expected.avgComments}, got ${avg(results.comments)}`);
    failed = true;
  }
  if (avg(results.changes) !== expected.avgChanges) {
    console.error(`Avg changes mismatch: expected ${expected.avgChanges}, got ${avg(results.changes)}`);
    failed = true;
  }
  if (avg(results.leadTimes) !== expected.avgLeadTime) {
    console.error(`Avg lead time mismatch: expected ${expected.avgLeadTime}, got ${avg(results.leadTimes)}`);
    failed = true;
  }

  if (!failed) {
    console.log('Logic verification successful!');
  } else {
    process.exit(1);
  }
}

run();
