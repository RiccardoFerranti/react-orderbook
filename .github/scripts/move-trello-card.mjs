import { pathToFileURL } from 'node:url';

// Development & Tech board and its Done list.
export const BOARD_ID = '6ad0ce6d847b8e8e8451c130';
export const DONE_LIST_ID = '6ad0cec340b2f0bdb3993e7c';

export function findTrelloCard(body) {
  const links = [...(body ?? '').matchAll(/^Trello:[ \t]*https:\/\/trello\.com\/c\/([A-Za-z0-9]{8})(?:\/[^\s]*)?[ \t]*$/gim)].map(
    (match) => match[1],
  );

  if (links.length === 0) return null;
  if (new Set(links).size > 1) throw new Error('The PR description contains multiple Trello cards.');
  return links[0];
}

export async function moveTrelloCard({ body, apiKey, apiToken, fetcher = fetch }) {
  const shortLink = findTrelloCard(body);
  if (!shortLink) return 'no-card';
  if (!apiKey || !apiToken) throw new Error('Configure TRELLO_API_KEY and TRELLO_API_TOKEN as GitHub repository secrets.');

  async function request(path, options = {}) {
    const url = new URL(path, 'https://api.trello.com');
    url.searchParams.set('key', apiKey);
    url.searchParams.set('token', apiToken);

    const response = await fetcher(url, options);
    if (!response.ok) throw new Error(`Trello request failed with HTTP ${response.status}.`);
    return response.json();
  }

  const card = await request(`/1/cards/${shortLink}?fields=id,idBoard,idList`);
  if (card.idBoard !== BOARD_ID) throw new Error('The Trello card is not on the expected board.');
  if (card.idList === DONE_LIST_ID) return 'already-done';

  const updated = await request(`/1/cards/${card.id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ idList: DONE_LIST_ID }),
  });
  if (updated.idList !== DONE_LIST_ID) throw new Error('Trello did not move the card to Done.');
  return 'moved';
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    const result = await moveTrelloCard({
      body: process.env.PR_BODY,
      apiKey: process.env.TRELLO_API_KEY,
      apiToken: process.env.TRELLO_API_TOKEN,
    });
    console.log(`Trello card: ${result}.`);
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
