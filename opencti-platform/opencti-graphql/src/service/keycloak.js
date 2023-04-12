/* eslint-disable no-unused-vars */
import qs from 'qs';
import Keycloak from 'keycloak-connect';
import axios from 'axios';
import * as R from 'ramda';
import jwt from 'jsonwebtoken';
import { defaultFieldResolver } from 'graphql';
import { getDirective, MapperKind, mapSchema } from '@graphql-tools/utils';
import { auth, hasPermission, hasRole, KeycloakContext } from 'keycloak-connect-graphql';
import KeycloakAdminClient from '@darklight/keycloak-admin-client';
import { v4 as uuid } from 'uuid';
import conf, { logApp } from '../config/conf';
import extractTokenFromBearer from '../utils/tokens';

const realm = conf.get('keycloak:realm');
const keycloakServer = conf.get('keycloak:server');
const clientId = conf.get('keycloak:client_id');
const secret = conf.get('keycloak:client_secret');
const enabled = process.env.POLICY_ENFORCEMENT ? process.env.POLICY_ENFORCEMENT === '1' : false;

let keycloakInstance;
let adminToken;

const keycloakAdminClient = new KeycloakAdminClient({
  serverUrl: keycloakServer,
  clientId,
  realm,
  credentials: {
    secret,
  },
});

export const keycloakEnabled = () => {
  return enabled;
};

const getKeycloak = () => {
  return keycloakInstance;
};

const refreshAdminToken = async () => {
  const endpoint = new URL(`${keycloakServer}realms/${realm}/protocol/openid-connect/token`);
  await axios
    .post(
      endpoint.href,
      qs.stringify({
        grant_type: 'client_credentials',
        client_id: clientId,
        client_secret: secret,
      }),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      }
    )
    .then((response) => {
      if (response.data?.access_token) {
        logApp.info('[KEYCLOAK] Admin access token has been updated');
        adminToken = response.data.access_token;
      } else {
        logApp.error('[KEYCLOAK] Failed to update admin access token; received no access token', { response });
      }
    })
    .catch((error) => {
      logApp.error('[KEYCLOAK] Failed to update admin access token', { error });
    });
};

const checkExpiration = async () => {
  if (!adminToken) {
    logApp.warn('[KEYCLOAK] Admin access token has not been set');
  }
  const decoded = jwt.decode(adminToken);
  const expiration = decoded.exp;
  const currentTime = Date.now() / 1000;
  if (expiration - 120 < currentTime) {
    await refreshAdminToken();
  }
};

const adminConfig = async () => {
  if (!adminToken) {
    await refreshAdminToken();
  } else {
    await checkExpiration();
  }
  return {
    headers: {
      Authorization: `Bearer ${adminToken}`,
    },
  };
};

// Checks an array of users after your filter, should be
//   - an array
//   - 0 or 1 user objects
// Returns nothing, simply used for logging and debugging purposes
const validateUserArray = (users) => {
  if (Array.isArray(users)) {
    const hasNullValues = users.some((item) => item === null || item === undefined);
    if (hasNullValues) {
      logApp.warn('[KEYCLOAK] Returned list of users has null or undefined entries', { users });
    }
    if (users.length === 0) {
      logApp.warn('[KEYCLOAK] List of users looks empty');
    }
    if (users.length > 1) {
      logApp.warn('[KEYCLOAK] Returned list of users contains more than one filtered down user', { users });
    }
  } else {
    logApp.error('[KEYCLOAK] Did not get expected array of users', { users });
  }
};

const getUsers = async () => {
  const endpoint = new URL(`${keycloakServer}admin/realms/${realm}/users`);
  const users = await axios
    .get(endpoint.href, await adminConfig())
    .then((response) => {
      const { data } = response;
      if (Array.isArray(data) && data.length > 0) {
        return data;
      }
      logApp.warn('Got something unexpected for a list of users; returning empty list', { data });
      return [];
    })
    .catch((error) => {
      logApp.error('Failed to get users', { error });
    });
  return users;
};

export const getUserById = async (userId) => {
  const users = await getUsers();
  const filteredUsers = R.filter(R.pipe(R.path(['id']), R.equals(userId)), users);
  validateUserArray(filteredUsers);
  if (filteredUsers.length === 1) {
    logApp.info('[KEYCLOAK] Found user by id', { user: userId });
    return filteredUsers[0];
  }
  logApp.error('[KEYCLOAK] Failed to find user by id', { userId });
  return undefined;
};

const setUserAttributes = async (userId, key, value) => {
  const user = await getUserById(userId);
  user.attributes[key] = value;
};

export const getAccessTokens = async (userId) => {
  if (!adminToken) {
    await refreshAdminToken();
  } else {
    await checkExpiration();
  }

  const tokenEndpoint = new URL(`${keycloakServer}realms/${realm}/protocol/openid-connect/token`);
  let accessToken;
  let refreshToken;
  let expiresIn;
  let tokenType;
  await axios
    .post(
      tokenEndpoint.href,
      qs.stringify({
        grant_type: 'urn:ietf:params:oauth:grant-type:token-exchange',
        client_id: clientId,
        client_secret: secret,
        subject_token: adminToken,
        // subject_token_type: 'urn:ietf:params:oauth:token-type:access_token',
        requested_subject: userId,
      }),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      }
    )
    .then((response) => {
      if (response.data?.access_token && response.data?.refresh_token) {
        logApp.info('[KEYCLOAK] Got impersonated user token', { userId });
        accessToken = response.data.access_token;
        refreshToken = response.data.refresh_token;
        expiresIn = response.data.expires_in;
        tokenType = response.data.token_type;
      } else {
        logApp.warn('[KEYCLOAK] Failed to extract tokens from response', { response: response.data });
      }
    })
    .catch((error, description) => {
      logApp.error('[KEYCLOAK] Failed to exchange token', { error, description });
      throw error;
    });
  return { access_token: accessToken, refresh_token: refreshToken, expires_in: expiresIn, token_type: tokenType };
};

// DD-732 Add support for authenticating via an API token
export const generateNewApiToken = async (userId) => {
  const user = await getUserById(userId);
  user.attributes.api_token = [uuid()];

  const endpoint = `${keycloakServer}admin/realms/${realm}/users/${userId}`;
  await axios
    .put(endpoint, user, await adminConfig())
    .then((response) => {
      logApp.info('[KEYCLOAK] API token updated for user', { user: user.email });
    })
    .catch((error) => {
      logApp.error('[KEYCLOAK] Failed to update user API token', { user: user.email, error });
    });
};

// DD-732 Add support for authenticating via an API token
export const getUserByApiToken = async (token) => {
  const users = await getUsers();
  const filteredUsers = R.filter(R.pipe(R.path(['attributes', 'api_token', 0]), R.equals(token)), users);
  validateUserArray(filteredUsers);
  logApp.info('[KEYCLOAK] Found user by api token', { user: filteredUsers[0].email });
  return filteredUsers[0];
};

export const getUserParentOrg = async (userId) => {
  const user = await getUserById(userId);
  validateUserArray([user]);
  if (user.attributes?.parent_org) {
    logApp.info('[KEYCLOAK] User parent organization id found', { user: user.email });
    return user.attributes.parent_org;
  }
  logApp.warn('[KEYCLOAK] Failed to find parent org in user attributes', { users: user });
  return undefined;
};

// DD-732 Add support for authenticating via an API token
export const getApiToken = async (userId) => {
  const users = await getUsers();
  const filteredUsers = R.filter(R.pipe(R.path(['id']), R.equals(userId)), users);
  validateUserArray(filteredUsers);
  if (filteredUsers[0].attributes?.api_token) {
    logApp.info('[KEYCLOAK] User api token found', { user: filteredUsers[0].email });
    return filteredUsers[0].attributes.api_token[0];
  }
  logApp.warn('[KEYCLOAK] User api token not found', { filteredUsers });
  return undefined;
};

// DD-445 Need to rework integration with Keycloak so that looking up a user by id works
export const getUserByEmail = async (email) => {
  const users = await getUsers();
  const filteredUsers = R.filter(R.pipe(R.path(['email']), R.equals(email)), users);
  validateUserArray(filteredUsers);
  if (filteredUsers.length === 1) {
    logApp.info('[KEYCLOAK] User found by email', { user: filteredUsers[0].email });
    return filteredUsers[0];
  }
  logApp.warn('[KEYCLOAK] May have found more than one user or no users; returning empty list', { filteredUsers });
  return [];
};

export const getSessions = async (userId) => {
  const endpoint = new URL(`${keycloakServer}admin/realms/${realm}/users/${userId}/sessions`);
  const sessions = await axios
    .get(endpoint.href, await adminConfig())
    .then((response) => {
      const { data } = response;
      const filteredSessions = R.filter(R.pipe(R.path(['userId']), R.equals(userId)), data);
      if (Array.isArray(filteredSessions) && filteredSessions?.length > 0) {
        logApp.info('[KEYCLOAK] Found sessions by user id', { userId });
        return filteredSessions;
      }
      logApp.warn('[KEYCLOAK] No sessions found for user', { userId });
      return [];
    })
    .catch((error) => {
      logApp.error('[KEYCLOAK] Failed to find user sessions by id', { error });
    });
  return sessions;
};

// DD-689 Deletes all active sessions for a user
export const endSessions = async (userId) => {
  const sessions = await getSessions(userId);
  if (!Array.isArray(sessions) && sessions.length < 1) {
    logApp.warn('Either there are no active sessions for that user or we got an unexpected response', { sessions });
  }

  const ids = sessions.map((session) => session.id);
  ids.forEach(async (id) => {
    const endpoint = new URL(`${keycloakServer}admin/realms/${realm}/sessions/${id}`);
    axios
      .delete(endpoint.href, await adminConfig())
      .then((response) => {
        logApp.info('[KEYCLOAK] Deleted sessions for user', { sessionId: id, userId });
      })
      .catch((error) => {
        logApp.error('[KEYCLOAK] Failed to delete user session', { error, sessionId: id, userId });
      });
  });
};

// DD-728 Allow for password changes
export const setUserPassword = async (userId, password) => {
  const user = await getUserById(userId);
  const endpoint = new URL(`${keycloakServer}admin/realms/${realm}/users/${userId}/reset-password`);
  axios
    .put(endpoint.href, { type: 'password', value: password, temporary: false }, await adminConfig())
    .then((response) => {
      logApp.info('[KEYCLOAK] Password reset for user', { user: user.email });
    })
    .catch((error) => {
      logApp.error('[KEYCLOAK] Failed to change password for user', { error, user: user.email });
    });
};

export const authDirectiveTransformer = (schema, directiveName = 'auth') => {
  return mapSchema(schema, {
    [MapperKind.OBJECT_FIELD]: (fieldConfig) => {
      if (keycloakEnabled()) {
        const authDirective = getDirective(schema, fieldConfig, directiveName)?.[0];
        if (authDirective) {
          const { r = defaultFieldResolver } = fieldConfig;
          fieldConfig.resolve = auth(r);
        }
      }
      return fieldConfig;
    },
  });
};

export const permissionDirectiveTransformer = (schema, directiveName = 'hasPermission') => {
  return mapSchema(schema, {
    [MapperKind.OBJECT_FIELD]: (fieldConfig) => {
      if (keycloakEnabled()) {
        const permissionDirective = getDirective(schema, fieldConfig, directiveName)?.[0];
        if (permissionDirective) {
          const { r = defaultFieldResolver } = fieldConfig;
          const keys = Object.keys(permissionDirective);
          let resources;
          if (keys.length === 1 && keys[0] === 'resources') {
            resources = permissionDirective[keys[0]];
            if (typeof resources === 'string') resources = [resources];
            if (Array.isArray(resources)) {
              resources = resources.map((val) => String(val));
            } else {
              throw new Error('invalid hasRole args. role must be a String or an Array of Strings');
            }
          } else {
            throw Error("invalid hasRole args. must contain only a 'role argument");
          }
          fieldConfig.resolve = hasPermission(resources)(r);
        }
      }
      return fieldConfig;
    },
  });
};

export const roleDirectiveTransformer = (schema, directiveName = 'hasRole') => {
  return mapSchema(schema, {
    [MapperKind.OBJECT_FIELD]: (fieldConfig) => {
      if (keycloakEnabled()) {
        const roleDirective = getDirective(schema, fieldConfig, directiveName)?.[0];
        if (roleDirective) {
          const { r = defaultFieldResolver } = fieldConfig;
          const keys = Object.keys(roleDirective);
          let role;
          if (keys.length === 1 && keys[0] === 'role') {
            role = roleDirective[keys[0]];
            if (typeof role === 'string') role = [role];
            if (Array.isArray(role)) {
              role = role.map((val) => String(val));
            } else {
              throw new Error('invalid hasRole args. role must be a String or an Array of Strings');
            }
          } else {
            throw Error("invalid hasRole args. must contain only a 'role argument");
          }
          fieldConfig.resolve = hasRole(role)(r);
        }
      }
      return fieldConfig;
    },
  });
};

export const keycloakAlive = async () => {
  try {
    logApp.info('[INIT] Authentication Keycloak admin client');
    await keycloakAdminClient.auth();
  } catch (e) {
    logApp.error(`[INIT] Keycloak admin client failed to authenticate`, e);
    throw e;
  }

  if (!keycloakEnabled()) return false;
  try {
    keycloakInstance = new Keycloak(
      {},
      {
        'auth-server-url': keycloakServer,
        resource: clientId,
        realm,
        credentials: {
          secret,
        },
      }
    );
    return true;
  } catch (e) {
    logApp.error(`[INIT] Failed to establish Keycloak Connect`, e);
    return false;
  }
};

const checkApiToken = async (req, res, next) => {
  const apiToken = extractTokenFromBearer(req.headers.authorization);
  if (!apiToken) {
    return next(); // No API token, skip to the next middleware
  }

  try {
    const user = await getUserByApiToken(apiToken);
    if (!user) {
      logApp.warn('[KEYCLOAK] No user found for given API token', { apiToken });
      return next(); // No user found, treat as a typical user
    }

    const {
      access_token: accessToken,
      refresh_token: refreshToken,
      expires_in: expiresIn,
    } = await getAccessTokens(user.id);

    user.access_token = accessToken;
    user.refresh_token = refreshToken;
    req.user = user;

    const kc = getKeycloak();
    const grant = await kc.grantManager.createGrant({
      access_token: accessToken,
      refresh_token: refreshToken,
      expires_in: expiresIn,
    });
    req.kauth = grant;
    logApp.info('[KEYCLOAK] Found user from API token; access tokens updated');
    return next();
  } catch (error) {
    logApp.error('[KEYCLOAK] Failed validating API token', { error });
    return res.status(500).send('Failed validating API token');
  }
};

export const configureKeycloakMiddleware = (route, expressApp) => {
  expressApp.use(route, checkApiToken);
  if (keycloakEnabled()) {
    expressApp.use(route, getKeycloak().middleware());
  }
};

export const applyKeycloakContext = (context, req) => {
  if (keycloakEnabled()) {
    context.kauth = new KeycloakContext({ req }, getKeycloak());
  }
};

export { keycloakAdminClient };
