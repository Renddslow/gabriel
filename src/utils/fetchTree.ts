import catchify from 'catchify';
import got from 'got';
import { get } from 'dot-prop';
import fm from 'frontmatter';

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;

const fetchTree = async (type: 'blog') => {
  const [err, res] = await catchify(
    got(`https://api.github.com/graphql`, {
      method: 'POST',
      body: JSON.stringify({
        query: `
          query { 
            repository(name: "flatland-site-hugo", owner:"flatlandchurch") {
              object(expression:"main:content/${type}") {
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
              }
            }
         }`,
      }),
      headers: {
        authorization: `Bearer ${GITHUB_TOKEN}`,
      },
    }).json(),
  );

  return get(res, 'data.repository.object.entries', []).map((file) => {
    const { data, content } = fm(get(file, 'object.text', ''));
    return {
      data: {
        ...data,
        fileName: get(file, 'name'),
      },
      content,
    };
  });
};

export default fetchTree;
