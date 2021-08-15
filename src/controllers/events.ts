import got from 'got';
import catchify from 'catchify';

import slugify from '../utils/slugify';
import fileExists from '../utils/fileExists';
import createFile from '../utils/createFile';
import yaml from 'yaml';

const CHURCHCENTER_TOKEN = process.env.CHURCHCENTER_TOKEN;

type SiteEvent = {
  id: string;
  title: string;
  startDate: string;
  day: string;
  time: string;
  image: string;
  location: string[];
  category: string;
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

const createEventContent = (event) => {
  const data = yaml.stringify(event);
  return `---\n${data.trim()}\n---`;
};

const events = async () => {
  const [err, res] = await catchify(
    got(`https://api.churchcenter.com/registrations/v2/events`, {
      headers: {
        authorization: `OrganizationToken ${CHURCHCENTER_TOKEN}`,
      },
    }).json(),
  );

  if (err) return {};

  const tree = res.data.map(({ id, attributes }) => {
    const eventYear = new Date(attributes.starts_at).getFullYear();
    const modifiedName = attributes.name.includes(eventYear.toString())
      ? attributes.name
      : `${attributes.name} ${eventYear}`;

    const data: Partial<SiteEvent> = {
      id: slugify(modifiedName),
      title: attributes.name,
      startDate: attributes.starts_at,
      day: attributes.event_time,
      time: formatter.format(new Date(attributes.starts_at)),
      category: 'All-Church',
      action: {
        label: `Sign Up`,
        url: attributes.new_registration_url,
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

  const newFiles = (
    await Promise.all(
      tree.map(async (event): Promise<SiteEvent> => {
        return {
          alreadyExists: await fileExists('event', event.id),
          ...event,
        };
      }),
    )
  ).filter(({ alreadyExists }) => !alreadyExists) as SiteEvent[];

  await Promise.all(
    newFiles.map(({ id, alreadyExists, ...content }) =>
      createFile('event', id, createEventContent(content), 'Church Center Registrations'),
    ),
  );

  return {
    meta: {
      count: newFiles.length,
      newFiles,
    },
  };
};

export default events;
