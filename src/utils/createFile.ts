import got from 'got';

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;

const BASE_URL = 'https://api.github.com/repos/flatlandchurch/flatland-site-hugo/contents/content';

const getFile = (dest: string) =>
  got(`${BASE_URL}/${dest}`, {
    searchParams: { access_token: GITHUB_TOKEN },
  })
    .json()
    .then(({ body }) => body)
    .catch(() => null);

const createFile = async (
  type: 'sermon' | 'event' | 'blog',
  permalink: string,
  content: string,
  src?: string,
) => {
  const pluralizedType = type !== 'blog' ? `${type}s` : type;
  const contentDest = `${pluralizedType}/${permalink}.md`;

  const file = await getFile(contentDest);
  console.log(file);

  const via = src || 'automation';

  console.log(`${BASE_URL}/${contentDest}`);

  const body = {
    message: `[gabriel-bot] Created new document via ${via} at "${contentDest}"`,
    content: Buffer.from(content).toString('base64'),
    sha: '',
  };

  if (file && file.sha) {
    body.sha = file.sha;
  }

  return got(`${BASE_URL}/${contentDest}`, {
    method: 'PUT',
    headers: {
      authorization: `Bearer ${GITHUB_TOKEN}`,
    },
    body: JSON.stringify(body),
  }).catch((e) => {
    console.log(e.response.statusCode);
    console.log(e.response.body);
  });
};

export default createFile;
