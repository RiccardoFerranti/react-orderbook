import { readFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';

// Development & Tech board and its Done list.
export const BOARD_ID = '6ad0ce6d847b8e8e8451c130';
export const DONE_LIST_ID = '6ad0cec340b2f0bdb3993e7c';

/**
 * Finds each distinct Trello card linked on a dedicated line in a PR description.
 * @param {string | null | undefined} body - The PR's Markdown description.
 * @returns {string[]} Trello card short links, in the order they appear.
 */
export function findTrelloCards(body) {
  const links = [...(body ?? '').matchAll(/^Trello:[ \t]*https:\/\/trello\.com\/c\/([A-Za-z0-9]{8})(?:\/[^\s]*)?[ \t]*$/gim)].map(
    (match) => match[1],
  );

  return [...new Set(links)];
}

/**
 * Gets the description of the PR merged at the commit that passed CI on main.
 * @param {object} options - Data needed to find the merged PR.
 * @param {object} options.event - The GitHub workflow_run event.
 * @param {string} options.githubToken - The GitHub API token for this workflow run.
 * @param {Function} options.fetch - The HTTP request function.
 * @returns {Promise<string | null>} The PR description, or null if no merged PR matches.
 */
export async function findMergedPullRequestBody({ event, githubToken, fetch }) {
  const run = event?.workflow_run;
  if (run?.conclusion !== 'success' || run?.event !== 'push' || run?.head_branch !== 'main') return null;

  const repository = event?.repository?.full_name;
  const sha = run.head_sha;
  // Check the event metadata before using it in a GitHub API URL: owner/repo must have
  // one slash and safe name characters, while a commit SHA must have 40 hex characters.
  // Also require the GitHub token needed for that API request.
  if (!/^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/.test(repository ?? '') || !/^[a-f0-9]{40}$/i.test(sha ?? '') || !githubToken) {
    throw new Error('Missing GitHub workflow metadata or API token.');
  }

  // A successful push to main can also be direct, so match a merged PR to the exact commit that updated main.
  let response;
  try {
    response = await fetch(`https://api.github.com/repos/${repository}/commits/${sha}/pulls`, {
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
  // A PR's body is its Markdown description, where we expect the Trello card link.
  return merged.length === 0 ? null : (merged[0].body ?? '');
}

/**
 * Moves one Trello card to Done after checking its board and current list.
 * @param {object} options - Data needed to update the card.
 * @param {string} options.shortLink - The card's eight-character short link.
 * @param {string} options.apiKey - The Trello API key.
 * @param {string} options.apiToken - The Trello API token.
 * @param {Function} options.fetch - The HTTP request function.
 * @returns {Promise<string>} Whether the card moved or was already in Done.
 */
async function moveTrelloCard({ shortLink, apiKey, apiToken, fetch }) {
  /**
   * Sends a Trello API request with credentials in the header and parses its JSON response.
   * @param {string} path - The path relative to the Trello API origin.
   * @param {object} [options] - Optional HTTP method, headers, and body.
   * @returns {Promise<object>} The parsed Trello response.
   */
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
      response = await fetch(url, { ...options, headers });
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

/**
 * Tries every distinct Trello card in a PR description independently.
 * @param {object} options - Data needed to process the PR's cards.
 * @param {string} options.body - The PR's Markdown description.
 * @param {string} options.apiKey - The Trello API key.
 * @param {string} options.apiToken - The Trello API token.
 * @param {Function} options.fetch - The HTTP request function.
 * @returns {Promise<string>} A summary of moved and already completed cards.
 * @throws {Error} After all cards are attempted, if any card failed.
 */
export async function moveTrelloCards({ body, apiKey, apiToken, fetch }) {
  const shortLinks = findTrelloCards(body);
  if (shortLinks.length === 0) return 'no-card';
  if (!apiKey || !apiToken) throw new Error('Configure TRELLO_API_KEY and TRELLO_API_TOKEN as GitHub repository secrets.');

  // Attempt every distinct card even if another card fails.
  const results = await Promise.allSettled(shortLinks.map((shortLink) => moveTrelloCard({ shortLink, apiKey, apiToken, fetch })));
  const failedCards = [];
  const movedCards = [];
  const alreadyDoneCards = [];
  for (const [index, result] of results.entries()) {
    if (result.status === 'rejected') failedCards.push({ shortLink: shortLinks[index], reason: result.reason });
    else if (result.value === 'moved') movedCards.push(shortLinks[index]);
    else if (result.value === 'already-done') alreadyDoneCards.push(shortLinks[index]);
  }
  if (failedCards.length === 1 && shortLinks.length === 1) throw failedCards[0].reason;
  if (failedCards.length > 0) {
    const details = failedCards.map(
      ({ shortLink, reason }) => `${shortLink}: ${reason instanceof Error ? reason.message : 'Unknown error.'}`,
    );
    throw new Error(
      `${movedCards.length} moved, ${alreadyDoneCards.length} already done, ${failedCards.length} failed. ${details.join(' ')}`,
    );
  }

  if (shortLinks.length === 1) return results[0].value;
  return `${movedCards.length} moved, ${alreadyDoneCards.length} already done`;
}

/**
 * Finds the merged PR after successful CI on main and processes its Trello cards.
 * @param {object} options - GitHub event and API access for both services.
 * @param {object} options.event - The GitHub workflow_run event.
 * @param {string} options.githubToken - The GitHub API token for this workflow run.
 * @param {string} options.apiKey - The Trello API key.
 * @param {string} options.apiToken - The Trello API token.
 * @param {Function} [options.fetch] - The HTTP request function; defaults to Node's fetch.
 * @returns {Promise<string>} The Trello result, or no-merged-pr when CI is ineligible.
 */
export async function moveCardAfterCi({ event, githubToken, apiKey, apiToken, fetch = globalThis.fetch }) {
  const body = await findMergedPullRequestBody({ event, githubToken, fetch });
  if (body === null) return 'no-merged-pr';
  return moveTrelloCards({ body, apiKey, apiToken, fetch });
}

// Run the GitHub Actions entry point only when Node starts this file directly.
// process.argv[1] is the entry script's path; import.meta.url is this script's file:// URL.
// Convert the path to a file URL before comparing them, so tests can import these functions
// without reading the GitHub event or moving a Trello card.
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    // GitHub Actions sets GITHUB_EVENT_PATH to a temporary JSON file describing what triggered this run.
    // Here it contains the completed CI workflow_run event, including its result and commit SHA.
    // readFile returns the file as text; JSON.parse turns that text into the event object used below.
    const event = JSON.parse(await readFile(process.env.GITHUB_EVENT_PATH, 'utf8'));
    const result = await moveCardAfterCi({
      event,
      githubToken: process.env.GITHUB_API_TOKEN,
      apiKey: process.env.TRELLO_API_KEY,
      apiToken: process.env.TRELLO_API_TOKEN,
    });
    console.log(`Trello cards: ${result}.`);
  } catch (error) {
    console.error(error instanceof Error ? error.message : 'Trello automation failed.');
    process.exitCode = 1;
  }
}
