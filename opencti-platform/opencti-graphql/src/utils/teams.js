import axios from 'axios';
import { logApp } from '../config/conf';

const send = async (title, text, sections) => {
  axios
    .post(process.env.MS_TEAMS_WEBHOOK, {
      '@type': 'MessageCard',
      '@Context': 'http://schema.org/extensions',
      title: `${title}`,
      text: `${text}`,
      sections,
    })
    .then((response) => {
      logApp.debug('GraphQL error sent to Teams', {
        status: response.status,
        statusText: response.statusText,
      });
    })
    .catch((axiosError) => {
      logApp.error(axiosError);
    });
};

const sendStacktrace = async (message, stacktrace) => {
  const sections = [
    {
      facts: [
        {
          name: 'Stacktrace',
          value: JSON.stringify(stacktrace),
        },
      ],
    },
  ];

  send('Error', message, sections)
    .then((response) => {
      logApp.debug('GraphQL error sent to Teams', {
        status: response.status,
        statusText: response.statusText,
      });
    })
    .catch((error) => {
      logApp.error('[TEAMS] Failed to send stacktrace', { error });
    });
};

export default sendStacktrace;
