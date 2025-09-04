import { NotFoundError as DataNotFoundError } from '@ember-data/adapter/error';

/**
 * Not Found Error
 */
class NotFoundError extends Error {
  statusCode = 404;
}

/**
 * return whether error means Not Found
 * @param  {Object} error Any error object
 * @return {Boolean}
 */
function is404(error) {
  return (
    error instanceof DataNotFoundError ||
    error instanceof NotFoundError ||
    error?.status === 404 ||
    error?.code === 404 ||
    error?.statusCode === 404
  );
}

export { is404, NotFoundError };
