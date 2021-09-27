import fetchTree from '../utils/fetchTree';

const blog = async () => {
  const posts = await fetchTree('blog');

  console.log(posts);

  const postsInFuture = posts.filter(
    ({ data }) =>
      data.publishDate && new Date(data.publishDate).toISOString() <= new Date().toISOString(),
  );

  console.log(postsInFuture);

  return {};
};

export default blog;
