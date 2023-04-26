const BEARER = 'Bearer ';

const extractTokenFromBearer = (authorization) => {
  const isBearer = authorization && authorization.startsWith(BEARER);
  return isBearer ? authorization.substring(BEARER.length) : null;
};

export default extractTokenFromBearer;
