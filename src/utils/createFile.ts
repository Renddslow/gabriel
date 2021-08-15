import got from 'got';

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;

const BASE_URL = 'https://api.github.com/repos/Renddslow/flatland-site-hugo/contents/content';

const createFile = async (
  type: 'sermon' | 'event' | 'blog',
  permalink: string,
  content: string,
  src?: string,
) => {
  const contentDest = `${type}/${permalink}.md`;

  const via = src || 'automation';

  return got(`${BASE_URL}/${contentDest}`, {
    searchParams: { access_token: GITHUB_TOKEN },
    method: 'PUT',
    body: JSON.stringify({
      message: `[gabriel-bot] Created new document via ${via} at "${contentDest}"`,
      content: Buffer.from(content).toString('base64'),
    }),
  }).catch((e) => console.log(e.body));
};

export default createFile;
