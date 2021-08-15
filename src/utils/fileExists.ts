import catchify from 'catchify';
import got from 'got';
import { has, get } from 'dot-prop';
import fm from 'frontmatter';

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;

export const fileExists = async (
  type: 'sermon' | 'blog' | 'event',
  permalink: string,
  matcher?: (frontmatter: Record<string, any>, content: string) => boolean,
): Promise<boolean> => {
  const pluralizedType = type !== 'blog' ? `${type}s` : type;

  const [err, res] = await catchify(
    got(`https://api.github.com/graphql`, {
      method: 'POST',
      body: JSON.stringify({
        query: `
        query { 
          repository(name: "flatland-site-hugo", owner:"flatlandchurch") {
            object(expression:"main:content/${pluralizedType}/${permalink}.md") {
                ...on Tree {
                  entries {
                      name
                      object {
                          ...on Blob {
                              text
                          }
                      }
                  }
                }
                ...on Blob {
                    text
                }
            }
          }
      }`,
      }),
      headers: {
        authorization: `Bearer ${GITHUB_TOKEN}`,
      },
    }).json(),
  );

  if (err) {
    return false;
  }

  if (has(res, 'data.repository.object.text')) {
    if (!matcher) return true;

    const { data, content } = fm(get(res.body, 'data.repository.object.text'));

    return matcher(data, content);
  }

  return false;
};
