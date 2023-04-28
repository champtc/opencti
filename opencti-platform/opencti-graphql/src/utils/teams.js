import axios from 'axios';
import { logApp } from '../config/conf';

const send = async (title, text, sections) => {
  if (process.env.MS_TEAMS_WEBHOOK) {
    axios
      .post(process.env.MS_TEAMS_WEBHOOK, {
        '@type': 'MessageCard',
        '@Context': 'http://schema.org/extensions',
        title: `${title}`,
        text: `${text}`,
        sections,
      })
      .then((response) => {
        return response;
      })
      .catch((error) => {
        logApp.error('[TEAMS] Failed to send message', { title, error });
      });
  }
};

export const sendStacktrace = async (title, message, stacktrace) => {
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

  send(title, message, sections)
    .then((response) => {
      if (response) {
        logApp.debug('[TEAMS] Stacktrace sent', {
          status: response.status,
          statusText: response.statusText,
        });
      }
    })
    .catch((error) => {
      logApp.error('[TEAMS] Failed to send stacktrace', { error });
    });
};

export default sendStacktrace;
