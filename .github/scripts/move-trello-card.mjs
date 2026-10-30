import { readFile } from 'node:fs/promises';
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

export async function findMergedPullRequestBody({ event, githubToken, fetcher = fetch }) {
  const run = event?.workflow_run;
  if (run?.conclusion !== 'success' || run?.event !== 'push' || run?.head_branch !== 'main') return null;

  const repository = event?.repository?.full_name;
  const sha = run.head_sha;
  if (!/^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/.test(repository ?? '') || !/^[a-f0-9]{40}$/i.test(sha ?? '') || !githubToken) {
    throw new Error('Missing GitHub workflow metadata or API token.');
  }

  // A successful push to main can also be a direct push, so identify its merged PR by the exact merge commit.
  let response;
  try {
    response = await fetcher(`https://api.github.com/repos/${repository}/commits/${sha}/pulls`, {
      headers: {
        Accept: 'application/vnd.github+json',
        Authorization: `Bearer ${githubToken}`,
      },
    });
  } catch {
    throw new Error('GitHub request failed.');
  }
  if (!response.ok) throw new Error(`GitHub request failed with HTTP ${response.status}.`);

  let pullRequests;
  try {
    pullRequests = await response.json();
  } catch {
    throw new Error('Invalid GitHub response.');
  }
  if (!Array.isArray(pullRequests)) throw new Error('Invalid GitHub response.');

  const merged = pullRequests.filter((pr) => pr.merged_at && pr.base?.ref === 'main' && pr.merge_commit_sha === sha);
  if (merged.length > 1) throw new Error('The CI commit is associated with multiple merged pull requests.');
  return merged.length === 0 ? null : (merged[0].body ?? '');
}

export async function moveTrelloCard({ body, apiKey, apiToken, fetcher = fetch }) {
  const shortLink = findTrelloCard(body);
  if (!shortLink) return 'no-card';
  if (!apiKey || !apiToken) throw new Error('Configure TRELLO_API_KEY and TRELLO_API_TOKEN as GitHub repository secrets.');

  async function request(path, options = {}) {
    const url = new URL(path, 'https://api.trello.com');
    // Trello accepts key and token in an Authorization header, keeping them out of URLs and URL logs.
    let headers;
    try {
      headers = new Headers(options.headers);
      headers.set('Authorization', `OAuth oauth_consumer_key="${apiKey}", oauth_token="${apiToken}"`);
    } catch {
      throw new Error('Invalid Trello credentials.');
    }

    let response;
    try {
      response = await fetcher(url, { ...options, headers });
    } catch {
      throw new Error('Trello request failed.');
    }
    if (!response.ok) throw new Error(`Trello request failed with HTTP ${response.status}.`);
    try {
      return await response.json();
    } catch {
      throw new Error('Invalid Trello response.');
    }
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

export async function moveCardAfterCi({ event, githubToken, apiKey, apiToken, fetcher = fetch }) {
  const body = await findMergedPullRequestBody({ event, githubToken, fetcher });
  if (body === null) return 'no-merged-pr';
  return moveTrelloCard({ body, apiKey, apiToken, fetcher });
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    const event = JSON.parse(await readFile(process.env.GITHUB_EVENT_PATH, 'utf8'));
    const result = await moveCardAfterCi({
      event,
      githubToken: process.env.GITHUB_API_TOKEN,
      apiKey: process.env.TRELLO_API_KEY,
      apiToken: process.env.TRELLO_API_TOKEN,
    });
    console.log(`Trello card: ${result}.`);
  } catch (error) {
    console.error(error instanceof Error ? error.message : 'Trello automation failed.');
    process.exitCode = 1;
  }
}
