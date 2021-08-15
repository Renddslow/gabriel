import { google } from 'googleapis';
import catchify from 'catchify';
import slug from 'slugify';
import { fileExists } from '../utils/git';

const ID = process.env.SERMONS_SHEET_ID;

type Sermon = {
  id: string;
  video: {
    type: string;
    id: string;
  };
  speaker: {
    permalink: string;
    name: string;
  };
  title: string;
  image: string;
  date: string;
  alreadyExists: boolean;
};

const slugify = (str: string) =>
  slug(str, {
    replacement: '-',
    remove: /[*+~.()'"!:@?]/g,
    lower: true,
  });

const getVimeoId = (url: string) => {
  const regexpr = /\/([\d]*)$/;
  const [, match] = regexpr.exec(url);
  return parseInt(match, 10);
};

const sermons = async () => {
  const sheets = google.sheets('v4');
  const auth = new google.auth.GoogleAuth({
    scopes: [
      'https://www.googleapis.com/auth/drive',
      'https://www.googleapis.com/auth/drive.file',
      'https://www.googleapis.com/auth/drive.readonly',
      'https://www.googleapis.com/auth/spreadsheets',
      'https://www.googleapis.com/auth/spreadsheets.readonly',
    ],
  });
  const authClient = await auth.getClient();

  const [err, data] = await catchify(
    sheets.spreadsheets.values.get({
      spreadsheetId: ID,
      range: 'A:E',
      auth: authClient,
    }),
  );

  if (err) return {};

  const rows = data.data.values.slice(1);

  const tree = rows.map((row) => {
    const date = new Date(row[4]);
    date.setHours(date.getHours() + 9 + 5, 30);

    return {
      id: slugify(row[0]),
      video: {
        type: 'vimeo',
        id: getVimeoId(row[1]),
      },
      speaker: {
        permalink: slugify(row[2]),
        name: row[2],
      },
      title: row[0],
      image: row[3],
      date: date.toISOString(),
    };
  });

  const newFiles = (
    await Promise.all(
      tree.map(async (sermon): Promise<Sermon> => {
        return {
          alreadyExists: await fileExists('sermon', sermon.id),
          ...sermon,
        };
      }),
    )
  ).filter(({ alreadyExists }) => !alreadyExists);

  return {};
};

export default sermons;
