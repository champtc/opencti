import * as R from 'ramda';
import { map } from 'ramda';
import bcrypt from 'bcryptjs';
import axios from 'axios';
import { delEditContext, notify, setEditContext } from '../database/redis';
import { AuthenticationFailure, FunctionalError } from '../config/errors';
import { BUS_TOPICS, logApp, logAudit, OPENCTI_SESSION } from '../config/conf';
import {
  batchListThroughGetTo,
  createRelation,
  deleteElementById,
  deleteRelationsByFromAndTo,
  listEntities,
  listThroughGetTo,
  loadById,
  patchAttribute,
  updateAttribute,
} from '../database/middleware';
import {
  ENTITY_TYPE_CAPABILITY,
  ENTITY_TYPE_GROUP,
  ENTITY_TYPE_ROLE,
  ENTITY_TYPE_USER,
} from '../schema/internalObject';
import {
  isInternalRelationship,
  RELATION_ACCESSES_TO,
  RELATION_HAS_CAPABILITY,
  RELATION_HAS_ROLE,
  RELATION_MEMBER_OF,
} from '../schema/internalRelationship';
import { ABSTRACT_INTERNAL_RELATIONSHIP, OPENCTI_ADMIN_UUID, OPENCTI_SYSTEM_UUID } from '../schema/general';
import { findAll as allMarkings } from './markingDefinition';
import { generateStandardId } from '../schema/identifier';
import { now } from '../utils/format';
import { applicationSession } from '../database/session';
import { convertRelationToAction, LOGIN_ACTION, LOGOUT_ACTION, ROLE_DELETION, USER_DELETION } from '../config/audit';
import { buildPagination, isEmptyField, isNotEmptyField } from '../database/utils';
import { BYPASS, SYSTEM_USER } from '../utils/access';
import { ENTITY_TYPE_MARKING_DEFINITION } from '../schema/stixMetaObject';
import { oidcRefresh } from '../config/tokenManagement';
import { endSessions, getAccessTokens, getUserByApiToken, getUserByEmail, getUserById } from '../service/keycloak';
import extractTokenFromBearer from '../utils/tokens';

const BASIC = 'Basic ';
export const STREAMAPI = 'STREAMAPI';
export const TAXIIAPI = 'TAXIIAPI';
export const ROLE_DEFAULT = 'Default';

export const userWithOrigin = (req, user) => {
  // /!\ This metadata information is used in different ways
  // - In audit logs to identified the user
  // - In stream message to also identifier the user
  // - In logging system to know the level of the error message
  const origin = {
    ip: req?.ip,
    user_id: user?.id,
    referer: req?.headers.referer,
    applicant_id: req?.headers['opencti-applicant-id'],
    call_retry_number: req?.headers['opencti-retry-number'],
  };
  return { ...user, origin };
};

const extractTokenFromBasicAuth = async (authorization) => {
  const isBasic = authorization && authorization.startsWith(BASIC);
  if (isBasic) {
    const b64auth = authorization.substring(BASIC.length);
    const [username, password] = Buffer.from(b64auth, 'base64').toString().split(':');
    // eslint-disable-next-line no-use-before-define
    const { api_token: tokenUUID } = await login(username, password);
    return tokenUUID;
  }
  return null;
};

const sendTeamsMessage = (title, message) => {
  if (process.env.MS_TEAMS_ACTIVITY_WEBHOOK) {
    axios
      .post(process.env.MS_TEAMS_ACTIVITY_WEBHOOK, {
        '@type': 'MessageCard',
        '@Context': 'http://schema.org/extensions',
        title: `${title}`,
        text: `${message}`,
      })
      .then((response) => {
        logApp.debug('Login message sent to Teams webhook', {
          status: response.status,
          statusText: response.statusText,
        });
      })
      .catch((axiosError) => {
        logApp.error(axiosError);
      });
  }
};

export const findAll = (user, args) => {
  return listEntities(user, [ENTITY_TYPE_USER], args);
};

export const batchGroups = async (user, userIds) => {
  return batchListThroughGetTo(user, userIds, RELATION_MEMBER_OF, ENTITY_TYPE_GROUP);
};

export const batchRoles = async (user, userId) => {
  return batchListThroughGetTo(user, userId, RELATION_HAS_ROLE, ENTITY_TYPE_ROLE, { paginate: false });
};

export const computeAvailableMarkings = (markings, all) => {
  const computedMarkings = [];
  for (let index = 0; index < markings.length; index += 1) {
    const mark = markings[index];
    // Find all marking of same type with rank <=
    const { id } = mark;
    const findMarking = R.find((m) => m.id === id, all);
    computedMarkings.push(findMarking);
    const { x_opencti_order: order, definition_type: type } = findMarking;
    const matchingMarkings = R.filter((m) => {
      return id !== m.id && m.definition_type === type && m.x_opencti_order <= order;
    }, all);
    computedMarkings.push(...matchingMarkings);
  }
  return R.uniqBy((m) => m.id, computedMarkings);
};

export const getUserAndGlobalMarkings = async (userId, capabilities) => {
  const userGroups = await listThroughGetTo(SYSTEM_USER, userId, RELATION_MEMBER_OF, ENTITY_TYPE_GROUP);
  const groupIds = userGroups.map((r) => r.id);
  const userCapabilities = map((c) => c.name, capabilities);
  const shouldBypass = userCapabilities.includes(BYPASS) || userId === OPENCTI_ADMIN_UUID;
  const allMarkingsPromise = allMarkings(SYSTEM_USER).then((data) => R.map((i) => i.node, data.edges));
  let userMarkingsPromise;
  if (shouldBypass) {
    userMarkingsPromise = allMarkingsPromise;
  } else {
    userMarkingsPromise = listThroughGetTo(SYSTEM_USER, groupIds, RELATION_ACCESSES_TO, ENTITY_TYPE_MARKING_DEFINITION);
  }
  const [userMarkings, markings] = await Promise.all([userMarkingsPromise, allMarkingsPromise]);
  const computedMarkings = computeAvailableMarkings(userMarkings, markings);
  return { user: computedMarkings, all: markings };
};

export const getMarkings = async (userId, capabilities) => {
  const marking = await getUserAndGlobalMarkings(userId, capabilities);
  return marking.user;
};

export const getCapabilities = async (userId) => {
  const roles = await listThroughGetTo(SYSTEM_USER, userId, RELATION_HAS_ROLE, ENTITY_TYPE_ROLE);
  const roleIds = roles.map((r) => r.id);
  const capabilities = await listThroughGetTo(SYSTEM_USER, roleIds, RELATION_HAS_CAPABILITY, ENTITY_TYPE_CAPABILITY);
  if (userId === OPENCTI_ADMIN_UUID && !R.find(R.propEq('name', BYPASS))(capabilities)) {
    const id = generateStandardId(ENTITY_TYPE_CAPABILITY, { name: BYPASS });
    capabilities.push({ id, standard_id: id, internal_id: id, name: BYPASS });
  }
  if (!R.find(R.propEq('name', 'SETTINGS'))(capabilities)) {
    const id = generateStandardId(ENTITY_TYPE_CAPABILITY, { name: 'SETTINGS' });
    capabilities.push({ id, standard_id: id, internal_id: id, name: 'SETTINGS' });
  }
  if (!R.find(R.propEq('name', 'MODULES'))(capabilities)) {
    const id = generateStandardId(ENTITY_TYPE_CAPABILITY, { name: 'MODULES' });
    capabilities.push({ id, standard_id: id, internal_id: id, name: 'MODULES' });
  }
  if (!R.find(R.propEq('name', 'KNOWLEDGE'))(capabilities)) {
    const id = generateStandardId(ENTITY_TYPE_CAPABILITY, { name: 'KNOWLEDGE' });
    capabilities.push({ id, standard_id: id, internal_id: id, name: 'KNOWLEDGE' });
  }
  if (!R.find(R.propEq('name', 'TAXIIAPI_SETCOLLECTIONS'))(capabilities)) {
    const id = generateStandardId(ENTITY_TYPE_CAPABILITY, { name: 'TAXIIAPI_SETCOLLECTIONS' });
    capabilities.push({ id, standard_id: id, internal_id: id, name: 'TAXIIAPI_SETCOLLECTIONS' });
  }
  return capabilities;
};

export const batchRoleCapabilities = async (user, roleId) => {
  return batchListThroughGetTo(user, roleId, RELATION_HAS_CAPABILITY, ENTITY_TYPE_CAPABILITY, { paginate: false });
};

export const findRoleById = (user, roleId) => {
  return loadById(user, roleId, ENTITY_TYPE_ROLE);
};

export const findRoles = (user, args) => {
  return listEntities(user, [ENTITY_TYPE_ROLE], args);
};

// region session management
export const findSessions = () => {
  const { store } = applicationSession();
  return new Promise((accept) => {
    store.all((err, result) => {
      const sessionsPerUser = R.groupBy(
        (s) => s.user.id,
        R.filter((n) => n.user, result)
      );
      const sessions = Object.entries(sessionsPerUser).map(([k, v]) => {
        return {
          user_id: k,
          sessions: v.map((s) => ({ id: s.id, created: s.user.session_creation })),
        };
      });
      accept(sessions);
    });
  });
};

export const findUserSessions = async (userId) => {
  const sessions = await findSessions();
  const userSessions = sessions.filter((s) => s.user_id === userId);
  if (userSessions.length > 0) {
    return R.head(userSessions).sessions;
  }
  return [];
};

export const fetchSessionTtl = (session) => {
  const { store } = applicationSession();
  return new Promise((accept) => {
    store.expiration(session.id, (err, ttl) => {
      accept(ttl);
    });
  });
};

export const killSession = (id) => {
  const { store } = applicationSession();
  return new Promise((accept) => {
    store.destroy(id, () => {
      accept(id);
    });
  });
};

export const killUserSessions = async (userId) => {
  const sessions = await findUserSessions(userId);
  const sessionsIds = sessions.map((s) => s.id);
  for (let index = 0; index < sessionsIds.length; index += 1) {
    const sessionId = sessionsIds[index];
    await killSession(sessionId);
  }
  return sessionsIds;
};
// endregion

export const findCapabilities = (user, args) => {
  const finalArgs = R.assoc('orderBy', 'attribute_order', args);
  return listEntities(user, [ENTITY_TYPE_CAPABILITY], finalArgs);
};

export const roleDelete = async (user, roleId) => {
  const del = await deleteElementById(user, roleId, ENTITY_TYPE_ROLE);
  logAudit.info(user, ROLE_DELETION, { id: roleId });
  return del;
};

export const roleCleanContext = async (user, roleId) => {
  await delEditContext(user, roleId);
  return loadById(user, roleId, ENTITY_TYPE_ROLE).then((role) =>
    notify(BUS_TOPICS[ENTITY_TYPE_ROLE].EDIT_TOPIC, role, user)
  );
};

export const roleEditContext = async (user, roleId, input) => {
  await setEditContext(user, roleId, input);
  return loadById(user, roleId, ENTITY_TYPE_ROLE).then((role) =>
    notify(BUS_TOPICS[ENTITY_TYPE_ROLE].EDIT_TOPIC, role, user)
  );
};

export const addUser = async (user, newUser) => {
  return notify(BUS_TOPICS[ENTITY_TYPE_USER].ADDED_TOPIC, {}, newUser);
};

export const roleEditField = async (user, roleId, input) => {
  const { element } = await updateAttribute(user, roleId, ENTITY_TYPE_ROLE, input);
  return notify(BUS_TOPICS[ENTITY_TYPE_ROLE].EDIT_TOPIC, element, user);
};

export const roleAddRelation = async (user, roleId, input) => {
  const role = await loadById(user, roleId, ENTITY_TYPE_ROLE);
  if (!role) {
    throw FunctionalError(`Cannot add the relation, ${ENTITY_TYPE_ROLE} cannot be found.`);
  }
  if (!isInternalRelationship(input.relationship_type)) {
    throw FunctionalError(`Only ${ABSTRACT_INTERNAL_RELATIONSHIP} can be added through this method.`);
  }
  const finalInput = R.assoc('fromId', roleId, input);
  return createRelation(user, finalInput).then((relationData) => {
    notify(BUS_TOPICS[ENTITY_TYPE_ROLE].EDIT_TOPIC, relationData, user);
    return relationData;
  });
};

export const roleDeleteRelation = async (user, roleId, toId, relationshipType) => {
  const role = await loadById(user, roleId, ENTITY_TYPE_ROLE);
  if (!role) {
    throw FunctionalError('Cannot delete the relation, Role cannot be found.');
  }
  if (!isInternalRelationship(relationshipType)) {
    throw FunctionalError(`Only ${ABSTRACT_INTERNAL_RELATIONSHIP} can be deleted through this method.`);
  }
  await deleteRelationsByFromAndTo(user, roleId, toId, relationshipType, ABSTRACT_INTERNAL_RELATIONSHIP);
  return notify(BUS_TOPICS[ENTITY_TYPE_ROLE].EDIT_TOPIC, role, user);
};

// User related
export const userEditField = async (user, userId, inputs) => {
  const input = R.head(inputs);
  const { key } = input;
  const value = key === 'password' ? [bcrypt.hashSync(R.head(input.value).toString())] : input.value;
  const patch = { [key]: value };
  const { element } = await patchAttribute(user, userId, ENTITY_TYPE_USER, patch);
  return notify(BUS_TOPICS[ENTITY_TYPE_USER].EDIT_TOPIC, element, user);
};

export const deleteBookmark = async (user, id) => {
  const currentUser = await loadById(user, user.id, ENTITY_TYPE_USER);
  const currentBookmarks = currentUser.bookmarks ? currentUser.bookmarks : [];
  const newBookmarks = R.filter((n) => n.id !== id, currentBookmarks);
  await patchAttribute(user, user.id, ENTITY_TYPE_USER, { bookmarks: newBookmarks });
  return id;
};

export const bookmarks = async (user, types) => {
  const currentUser = await loadById(user, user.id, ENTITY_TYPE_USER);
  const bookmarkList =
    types && types.length > 0
      ? R.filter((n) => R.includes(n.type, types), currentUser.bookmarks || [])
      : currentUser.bookmarks || [];
  const filteredBookmarks = [];
  // eslint-disable-next-line no-restricted-syntax
  for (const bookmark of bookmarkList) {
    const loadedBookmark = await loadById(user, bookmark.id, bookmark.type);
    if (isNotEmptyField(loadedBookmark)) {
      filteredBookmarks.push(loadedBookmark);
    } else {
      await deleteBookmark(user, bookmark.id);
    }
  }
  return buildPagination(
    0,
    null,
    filteredBookmarks.map((n) => ({ node: n })),
    filteredBookmarks.length
  );
};

export const addBookmark = async (user, id, type) => {
  const currentUser = await loadById(user, user.id, ENTITY_TYPE_USER);
  const currentBookmarks = currentUser.bookmarks ? currentUser.bookmarks : [];
  const newBookmarks = R.append(
    { id, type },
    R.filter((n) => n.id !== id, currentBookmarks)
  );
  await patchAttribute(user, user.id, ENTITY_TYPE_USER, { bookmarks: newBookmarks });
  return loadById(user, id, type);
};

export const meEditField = (user, userId, inputs) => {
  return userEditField(user, userId, inputs);
};

export const userDelete = async (user, userId) => {
  await deleteElementById(user, userId, ENTITY_TYPE_USER);
  logAudit.info(user, USER_DELETION, { user: userId });
  return userId;
};

export const userAddRelation = async (user, userId, input) => {
  const userData = await loadById(user, userId, ENTITY_TYPE_USER);
  if (!userData) {
    throw FunctionalError(`Cannot add the relation, ${ENTITY_TYPE_USER} cannot be found.`);
  }
  if (!isInternalRelationship(input.relationship_type)) {
    throw FunctionalError(`Only ${ABSTRACT_INTERNAL_RELATIONSHIP} can be added through this method.`);
  }
  const finalInput = R.assoc('fromId', userId, input);
  const relationData = await createRelation(user, finalInput);
  const operation = convertRelationToAction(input.relationship_type);
  logAudit.info(user, operation, { from: userId, to: input.toId, type: input.relationship_type });
  return notify(BUS_TOPICS[ENTITY_TYPE_USER].EDIT_TOPIC, relationData, user);
};

export const userDeleteRelation = async (user, targetUser, toId, relationshipType) => {
  if (!isInternalRelationship(relationshipType)) {
    throw FunctionalError(`Only ${ABSTRACT_INTERNAL_RELATIONSHIP} can be deleted through this method.`);
  }
  await deleteRelationsByFromAndTo(user, targetUser.id, toId, relationshipType, ABSTRACT_INTERNAL_RELATIONSHIP);
  const operation = convertRelationToAction(relationshipType, false);
  logAudit.info(user, operation, { from: targetUser.id, to: toId, type: relationshipType });
  return notify(BUS_TOPICS[ENTITY_TYPE_USER].EDIT_TOPIC, targetUser, user);
};

export const userIdDeleteRelation = async (user, userId, toId, relationshipType) => {
  const userData = await loadById(user, userId, ENTITY_TYPE_USER);
  if (!userData) {
    throw FunctionalError('Cannot delete the relation, User cannot be found.');
  }
  if (!isInternalRelationship(relationshipType)) {
    throw FunctionalError(`Only ${ABSTRACT_INTERNAL_RELATIONSHIP} can be deleted through this method.`);
  }
  return userDeleteRelation(user, userData, toId, relationshipType);
};

export const loginFromProvider = async (userInfo, accessToken, refreshToken) => {
  const { email } = userInfo;
  if (isEmptyField(email)) {
    throw Error('User email not provided');
  }
  const user = await getUserByEmail(userInfo.email);
  return { ...user, access_token: accessToken, refresh_token: refreshToken };
};

export const login = async (email, password) => {
  const user = await getUserByEmail(email);
  if (!user) throw AuthenticationFailure();
  const dbPassword = user.password;
  const match = bcrypt.compareSync(password, dbPassword);
  if (!match) throw AuthenticationFailure();
  return user;
};

export const logout = async (user, req, res) => {
  res.clearCookie(OPENCTI_SESSION);
  req.session.destroy();
  endSessions(user.id);
  logAudit.info(user, LOGOUT_ACTION);
  sendTeamsMessage(LOGOUT_ACTION, `${user.user_email} logged out`);
  return user.id;
};

const buildSessionUser = async (user) => {
  if (user?.attributes && !user?.access_token) {
    const { access_token: access, refresh_token: refresh } = await getAccessTokens(user.id);
    user.access_token = access;
    user.refresh_token = refresh;
  }
  return {
    id: user.id,
    session_creation: now(),
    user_email: user.email,
    access_token: user.access_token,
    refresh_token: user.refresh_token,
    name: `${user.firstName} ${user.lastName}`,
    capabilities: user.capabilities.map((c) => ({ id: c.id, internal_id: c.internal_id, name: c.name })),
    allowed_marking: user.allowed_marking.map((m) => ({
      id: m.id,
      standard_id: m.standard_id,
      internal_id: m.internal_id,
      definition_type: m.definition_type,
    })),
    all_marking: user.all_marking.map((m) => ({
      id: m.id,
      standard_id: m.standard_id,
      internal_id: m.internal_id,
      definition_type: m.definition_type,
    })),
  };
};

const buildCompleteUser = async (client) => {
  if (!client) return undefined;
  const capabilities = await getCapabilities(client.id);
  const marking = await getUserAndGlobalMarkings(client.id, capabilities);
  const user = { ...client, capabilities, allowed_marking: marking.user, all_marking: marking.all };
  return buildSessionUser(user);
};

export const findById = async (user, userId) => {
  const kcUser = await getUserById(userId);
  if (typeof kcUser === 'object' && Object.keys(kcUser).length === 0) {
    return undefined;
  }
  const completeUser = await buildCompleteUser(kcUser);
  return completeUser;
};

export const resolveUserById = async (id) => {
  if (id === OPENCTI_SYSTEM_UUID) {
    return SYSTEM_USER;
  }
  const client = await loadById(SYSTEM_USER, id, ENTITY_TYPE_USER);
  return buildCompleteUser(client);
};

const resolveUserByToken = async (tokenValue) => {
  const user = await getUserByApiToken(tokenValue);
  const completeUser = await buildCompleteUser(user);
  return completeUser;
};

// TODO: Before calling the refresh function, check to see if the token has already expired
export const userRenewToken = async (user, userId) => {
  if (user.access_token && user.refresh_token) {
    const tokens = await oidcRefresh(user.refresh_token);
    user.access_token = tokens.accessToken;
    user.refresh_token = tokens.refreshToken;
  }
  return user;
};

export const authenticateUser = async (req, user, provider) => {
  // Build the user session with only required fields
  const sessionUser = await buildCompleteUser(user);
  if (provider !== 'Bearer') {
    logAudit.info(userWithOrigin(req, user), LOGIN_ACTION, { provider });
    sendTeamsMessage(LOGIN_ACTION, `${user.user_email} logged in`);
  }
  req.session.user = sessionUser;
  return sessionUser;
};

export const authenticateUserFromRequest = async (req) => {
  const auth = req?.session?.user;
  if (auth) {
    return authenticateUser(req, auth, 'Bearer');
  }
  // If user not identified, try to extract token from bearer
  let loginProvider = 'Bearer';
  let authToken = extractTokenFromBearer(req?.headers.authorization);
  // If no bearer specified, try with basic auth
  if (!authToken) {
    loginProvider = 'BasicAuth';
    authToken = await extractTokenFromBasicAuth(req?.headers.authorization);
  }
  // Get user from the token if found
  if (authToken) {
    try {
      const user = await resolveUserByToken(authToken);
      if (req && user) {
        await authenticateUser(req, user, loginProvider);
      }
      return user;
    } catch (error) {
      logApp.error('[CYIO] Authentication error', { error });
    }
  }
  return undefined;
};

export const initAdmin = async (email, password, tokenValue) => {
  const existingAdmin = await findById(SYSTEM_USER, OPENCTI_ADMIN_UUID);
  if (existingAdmin) {
    logApp.info('[INIT] Admin user exists, patching...');
    // If admin user exists, just patch the fields
    const patch = {
      user_email: email,
      password: bcrypt.hashSync(password),
      api_token: tokenValue,
      external: true,
    };
    await patchAttribute(SYSTEM_USER, existingAdmin.id, ENTITY_TYPE_USER, patch);
    logApp.info('[INIT] Admin user patched');
  } else {
    const userToCreate = {
      internal_id: OPENCTI_ADMIN_UUID,
      external: true,
      user_email: email.toLowerCase(),
      name: 'admin',
      firstname: 'Admin',
      lastname: 'OpenCTI',
      description: 'Principal admin account',
      api_token: tokenValue,
      access_token: null,
      refresh_token: null,
      password,
    };
    await addUser(SYSTEM_USER, userToCreate);
    logApp.info('[INIT] Admin user created');
  }
};

// region context
export const userCleanContext = async (user, userId) => {
  await delEditContext(user, userId);
  return loadById(user, userId, ENTITY_TYPE_USER).then((userToReturn) =>
    notify(BUS_TOPICS[ENTITY_TYPE_USER].EDIT_TOPIC, userToReturn, user)
  );
};

export const userEditContext = async (user, userId, input) => {
  await setEditContext(user, userId, input);
  return loadById(user, userId, ENTITY_TYPE_USER).then((userToReturn) =>
    notify(BUS_TOPICS[ENTITY_TYPE_USER].EDIT_TOPIC, userToReturn, user)
  );
};
// endregion
