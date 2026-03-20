
const mockPRs = Array.from({ length: 30 }, (_, i) => ({
  repository_url: 'https://api.github.com/repos/owner/repo',
  number: i + 1,
}));

const DELAY = 100;

async function graphqlQueryMock() {
  await new Promise(resolve => setTimeout(resolve, DELAY));
  return {};
}

async function sequential(items) {
  const batchSize = 20;
  let results = [];
  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    // Simulating query construction
    const queries = batch.map((_, idx) => `pr${idx}: ...`).join(' ');
    await graphqlQueryMock();
    // Simulating processing
    for (let idx = 0; idx < batch.length; idx++) {
      results.push({ pr: {}, item: batch[idx] });
    }
  }
  return results;
}

async function concurrent(items) {
  const batchSize = 20;
  const batchPromises = [];
  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    const queries = batch.map((_, idx) => `pr${idx}: ...`).join(' ');
    batchPromises.push(graphqlQueryMock().then(prData => ({ batch, prData })));
  }

  const allBatchResults = await Promise.all(batchPromises);
  let results = [];
  for (const { batch, prData } of allBatchResults) {
    for (let idx = 0; idx < batch.length; idx++) {
      results.push({ pr: {}, item: batch[idx] });
    }
  }
  return results;
}

async function run() {
  console.log('Running benchmark with 30 items (2 batches of 20)...');

  const startSeq = Date.now();
  await sequential(mockPRs);
  const endSeq = Date.now();
  console.log(`Sequential: ${endSeq - startSeq}ms`);

  const startCon = Date.now();
  await concurrent(mockPRs);
  const endCon = Date.now();
  console.log(`Concurrent: ${endCon - startCon}ms`);
}

run();
