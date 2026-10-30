import assert from 'node:assert/strict';
import { it } from 'node:test';

import {
  BOARD_ID,
  DONE_LIST_ID,
  findMergedPullRequestBody,
  findTrelloCard,
  moveCardAfterCi,
  moveTrelloCard,
} from './move-trello-card.mjs';

const body = '## Summary\n\n- Update the order book.\n\nTrello: https://trello.com/c/lLHu71nJ/13-order-book';
const sha = 'a'.repeat(40);
const event = {
  repository: { full_name: 'owner/repository' },
  workflow_run: { conclusion: 'success', event: 'push', head_branch: 'main', head_sha: sha },
};

function ok(data) {
  return { ok: true, json: async () => data };
}

it('should find a Trello card only in a dedicated link line', () => {
  assert.equal(findTrelloCard(body), 'lLHu71nJ');
  assert.equal(findTrelloCard('See https://trello.com/c/lLHu71nJ in the notes.'), null);
  assert.equal(findTrelloCard('Trello: https://trello.com/c/not-a-short-link'), null);
  assert.throws(() => findTrelloCard('Trello: https://trello.com/c/lLHu71nJ\nTrello: https://trello.com/c/AbCd1234'));
});

it('should skip a PR without a Trello card', async () => {
  const result = await moveTrelloCard({
    body: '## Summary\n\n- Update CI.',
    fetcher: () => assert.fail('No API request expected'),
  });
  assert.equal(result, 'no-card');
});

it('should move a card on the expected board to Done', async () => {
  const calls = [];
  const result = await moveTrelloCard({
    body,
    apiKey: 'example-key',
    apiToken: 'example-token',
    fetcher: async (url, options) => {
      calls.push({ url, options });
      return calls.length === 1
        ? ok({ id: 'card-id', idBoard: BOARD_ID, idList: 'other-list' })
        : ok({ id: 'card-id', idList: DONE_LIST_ID });
    },
  });

  assert.equal(result, 'moved');
  assert.equal(calls.length, 2);
  assert.equal(calls[0].url.pathname, '/1/cards/lLHu71nJ');
  assert.equal(calls[1].url.pathname, '/1/cards/card-id');
  assert.equal(calls[0].url.searchParams.get('fields'), 'id,idBoard,idList');
  for (const call of calls) {
    assert.equal(call.url.searchParams.has('key'), false);
    assert.equal(call.url.searchParams.has('token'), false);
    assert.equal(
      call.options.headers.get('Authorization'),
      'OAuth oauth_consumer_key="example-key", oauth_token="example-token"',
    );
  }
  assert.equal(calls[0].options.method, undefined);
  assert.equal(calls[1].options.method, 'PUT');
  assert.equal(calls[1].options.headers.get('Content-Type'), 'application/json');
  assert.deepEqual(JSON.parse(calls[1].options.body), { idList: DONE_LIST_ID });
});

it('should keep Trello credentials out of request errors', async () => {
  await assert.rejects(
    moveTrelloCard({
      body,
      apiKey: 'example-key',
      apiToken: 'example-token',
      fetcher: () => {
        throw new Error('example-key example-token');
      },
    }),
    (error) => error.message === 'Trello request failed.',
  );
  await assert.rejects(
    moveTrelloCard({
      body,
      apiKey: 'example-key',
      apiToken: 'example-token',
      fetcher: async () => ({ ok: false, status: 401 }),
    }),
    (error) => error.message === 'Trello request failed with HTTP 401.',
  );
  await assert.rejects(
    moveTrelloCard({
      body,
      apiKey: 'example-key',
      apiToken: 'invalid\ntoken',
      fetcher: () => assert.fail('No API request expected'),
    }),
    (error) => error.message === 'Invalid Trello credentials.',
  );
});

it('should not move a card from another board', async () => {
  let requests = 0;
  await assert.rejects(
    moveTrelloCard({
      body,
      apiKey: 'example-key',
      apiToken: 'example-token',
      fetcher: async () => {
        requests += 1;
        return ok({ id: 'card-id', idBoard: 'another-board', idList: 'other-list' });
      },
    }),
    /expected board/,
  );
  assert.equal(requests, 1);
});

it('should not update a card already in Done', async () => {
  let requests = 0;
  const result = await moveTrelloCard({
    body,
    apiKey: 'example-key',
    apiToken: 'example-token',
    fetcher: async () => {
      requests += 1;
      return ok({ id: 'card-id', idBoard: BOARD_ID, idList: DONE_LIST_ID });
    },
  });
  assert.equal(result, 'already-done');
  assert.equal(requests, 1);
});

it('should ignore failed, skipped, and pull request CI runs', async () => {
  for (const workflowRun of [
    { conclusion: 'failure' },
    { conclusion: 'skipped' },
    { event: 'pull_request' },
    { head_branch: 'feature' },
  ]) {
    const result = await moveCardAfterCi({
      event: { ...event, workflow_run: { ...event.workflow_run, ...workflowRun } },
      fetcher: () => assert.fail('No API request expected'),
    });
    assert.equal(result, 'no-merged-pr');
  }
});

it('should find only a PR merged into main at the successful CI commit', async () => {
  const calls = [];
  const result = await findMergedPullRequestBody({
    event,
    githubToken: 'github-example-token',
    fetcher: async (url, options) => {
      calls.push({ url, options });
      return ok([
        { body: 'wrong branch', merged_at: '2026-10-30T00:00:00Z', base: { ref: 'develop' }, merge_commit_sha: sha },
        { body: 'wrong commit', merged_at: '2026-10-30T00:00:00Z', base: { ref: 'main' }, merge_commit_sha: 'b'.repeat(40) },
        { body, merged_at: '2026-10-30T00:00:00Z', base: { ref: 'main' }, merge_commit_sha: sha },
      ]);
    },
  });
  assert.equal(result, body);
  assert.equal(calls.length, 1);
  assert.equal(calls[0].url, `https://api.github.com/repos/owner/repository/commits/${sha}/pulls`);
  assert.equal(calls[0].options.headers.Authorization, 'Bearer github-example-token');
});

it('should not call Trello for a direct push or PR without a Trello link', async () => {
  for (const pullRequests of [
    [],
    [{ body: '## Summary', merged_at: '2026-10-30T00:00:00Z', base: { ref: 'main' }, merge_commit_sha: sha }],
  ]) {
    let requests = 0;
    const result = await moveCardAfterCi({
      event,
      githubToken: 'github-example-token',
      fetcher: async () => {
        requests += 1;
        return ok(pullRequests);
      },
    });
    assert.equal(result, pullRequests.length ? 'no-card' : 'no-merged-pr');
    assert.equal(requests, 1);
  }
});

it('should move the linked merged PR card after a successful main CI run', async () => {
  const calls = [];
  const result = await moveCardAfterCi({
    event,
    githubToken: 'github-example-token',
    apiKey: 'example-key',
    apiToken: 'example-token',
    fetcher: async (url, options) => {
      calls.push({ url, options });
      if (calls.length === 1)
        return ok([{ body, merged_at: '2026-10-30T00:00:00Z', base: { ref: 'main' }, merge_commit_sha: sha }]);
      return calls.length === 2
        ? ok({ id: 'card-id', idBoard: BOARD_ID, idList: 'other-list' })
        : ok({ id: 'card-id', idList: DONE_LIST_ID });
    },
  });
  assert.equal(result, 'moved');
  assert.equal(calls.length, 3);
});
