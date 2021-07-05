require('dotenv').config()

import { IncomingMessage, ServerResponse } from 'http';
import body from 'body/json';
import catchify from 'catchify';

import sermons from './controllers/sermons';

const bodyParser = (req: IncomingMessage, res: ServerResponse): Promise<Record<string, any>> => new Promise((resolve, reject) => {
  body(req, res, (err, payload) => {
    if (err) return reject(err);
    return resolve(payload as Record<string, any>);
  });
});

const send = (r: ServerResponse) => (body: Record<string, any>) => {
  r.end(JSON.stringify(body));
};

module.exports = async (req: IncomingMessage, res: ServerResponse) => {
  const sender = send(res);
  res.setHeader('Content-Type', 'application/json');
  if (req.method.toUpperCase() !== 'POST') {
    res.statusCode = 405;
    return sender({ errors: [{ code: 405, message: 'Method not allowed' }] });
  }

  const [err, payload] = await catchify(bodyParser(req, res));

  if (err) {
    res.statusCode = 400;
    return sender({
      errors: [{ code: 400, message: 'Malformed body' }],
    });
  }

  const type = payload.data && payload.data.type;

  if (!type) {
    res.statusCode = 400;
    return sender({
      errors: [{ code: 400, message: 'Missing type' }],
    });
  }


  switch(type) {
    case 'sermon': return sender(await sermons());
    case 'blog': return sender({});
    default: {
      res.statusCode = 400;
      return sender({
        errors: [{ code: 400, message: 'Provided type is not available' }]
      });
    }
  }
};
