import got from 'got';

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;

const BASE_URL = 'https://api.github.com/repos/flatlandchurch/flatland-site-hugo/contents/content';

const createFile = async (
  type: 'sermon' | 'event' | 'blog',
  permalink: string,
  content: string,
  src?: string,
) => {
  const pluralizedType = type !== 'blog' ? `${type}s` : type;
  const contentDest = `${pluralizedType}/${permalink}.md`;

  const via = src || 'automation';

  console.log(`${BASE_URL}/${contentDest}`);

  return got(`${BASE_URL}/${contentDest}`, {
    method: 'PUT',
    headers: {
      authorization: `Bearer ${GITHUB_TOKEN}`,
    },
    body: JSON.stringify({
      message: `[gabriel-bot] Created new document via ${via} at "${contentDest}"`,
      content: Buffer.from(content).toString('base64'),
    }),
  }).catch((e) => console.log(e));
};

export default createFile;
