import slug from 'slugify';

const slugify = (str: string) =>
  slug(str, {
    replacement: '-',
    remove: /[*+~.()'"!:@?]/g,
    lower: true,
  });

export default slugify;
