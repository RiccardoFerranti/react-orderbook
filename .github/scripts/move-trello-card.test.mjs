import assert from 'node:assert/strict';
import test from 'node:test';

import { BOARD_ID, DONE_LIST_ID, findTrelloCard, moveTrelloCard } from './move-trello-card.mjs';

const body = '## Summary\n\n- Update the order book.\n\nTrello: https://trello.com/c/lLHu71nJ/13-order-book';

function ok(data) {
  return { ok: true, json: async () => data };
}

test('finds a Trello card only in a dedicated link line', () => {
  assert.equal(findTrelloCard(body), 'lLHu71nJ');
  assert.equal(findTrelloCard('See https://trello.com/c/lLHu71nJ in the notes.'), null);
  assert.throws(() => findTrelloCard('Trello: https://trello.com/c/lLHu71nJ\nTrello: https://trello.com/c/AbCd1234'));
});

test('skips a PR without a Trello card', async () => {
  const result = await moveTrelloCard({
    body: '## Summary\n\n- Update CI.',
    fetcher: () => assert.fail('No API request expected'),
  });
  assert.equal(result, 'no-card');
});

test('moves a card on the expected board to Done', async () => {
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
  assert.equal(calls[1].options.method, 'PUT');
  assert.deepEqual(JSON.parse(calls[1].options.body), { idList: DONE_LIST_ID });
});

test('does not move a card from another board', async () => {
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

test('does not update a card already in Done', async () => {
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
