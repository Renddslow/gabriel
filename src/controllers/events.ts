import got from 'got';
import catchify from 'catchify';
import { get } from 'dot-prop';
import pThrottle from 'p-throttle';

import slugify from '../utils/slugify';
import createFile from '../utils/createFile';
import yaml from 'yaml';

type SiteEvent = {
  id: string;
  title: string;
  startDate: string;
  day: string;
  time: string;
  image: string;
  location: string[];
  category: string;
  content: string;
  action?: {
    label: string;
    url: string;
  };
  pco_id: number;
  price?: string;
  alreadyExists: boolean;
};

const formatter = new Intl.DateTimeFormat('en-US', {
  hour: 'numeric',
  minute: '2-digit',
});

const createEventContent = ({ content, ...event }) => {
  const data = yaml.stringify(event);
  console.log(content);
  return `---\n${data.trim()}\n---\n${content}`;
};

const events = async () => {
  const [initErr, initRes] = await catchify(got('https://flatland.churchcenter.com'));
  const tokenRegexpr = /<meta name="csrf-token" content="(.*?)" \/>/;

  const csrf = tokenRegexpr.exec(initRes.body.toString());

  if (!csrf || initErr) return {};

  const [, csrfToken] = csrf;

  const [tokenErr, tokens] = await catchify(
    got('https://flatland.churchcenter.com/sessions/tokens', {
      headers: {
        'x-csrf-token': csrfToken,
      },
      method: 'POST',
    }).json(),
  );

  const orgToken = get(tokens, 'data.attributes.token', '');

  const [err, res] = await catchify(
    got(`https://api.churchcenter.com/registrations/v2/events`, {
      headers: {
        authorization: `OrganizationToken ${orgToken}`,
      },
    }).json(),
  );

  if (err) {
    console.log(err.response.body);
    return {};
  }

  const tree = res.data.map(({ id, attributes }) => {
    const modifiedName = `${attributes.name} ${id}`;

    const data: Partial<SiteEvent> = {
      id: slugify(modifiedName),
      title: attributes.name,
      startDate: attributes.starts_at,
      day: attributes.event_time,
      time: formatter.format(new Date(attributes.starts_at)),
      category: 'All-Church',
      content: attributes.stripped_description,
      action: {
        label: `Sign Up`,
        url: attributes.public_url,
      },
      image: attributes.logo_url,
      pco_id: id,
    };

    if (!attributes.free) {
      data.price = attributes.event_price_with_range.startsWith('$')
        ? attributes.event_price_with_range
        : `$${attributes.event_price_with_range}`;
    }

    return data;
  });

  const throttle = pThrottle({
    limit: 1,
    interval: 2000,
  });

  const throttled = throttle(({ id, ...content }) =>
    createFile('event', id, createEventContent(content), 'Church Center Registrations'),
  );

  await Promise.all((tree as SiteEvent[]).map(throttled));

  return {
    meta: {
      count: tree.length,
      tree,
    },
  };
};

export default events;
