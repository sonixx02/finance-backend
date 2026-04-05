const ApiError = require('../utils/apiError');

function validate(schema, source = 'body') {
  return (req, res, next) => {
    void res;

    const parsed = schema.safeParse(req[source]);

    if (!parsed.success) {
      return next(ApiError.badRequest('Validation failed.', parsed.error.flatten()));
    }

    req[source] = parsed.data;
    return next();
  };
}

module.exports = validate;
