import { HttpError } from '../utils/HttpError.js';

const dropEmptyStrings = (obj) =>
  Object.fromEntries(Object.entries(obj).filter(([, value]) => value !== ''));

export const validate = (schemas) => (req, _res, next) => {
  req.valid = {};
  const details = [];

  for (const [source, schema] of Object.entries(schemas)) {
    const input = source === 'query' ? dropEmptyStrings(req.query) : (req[source] ?? {});
    const result = schema.safeParse(input);

    if (result.success) {
      req.valid[source] = result.data;
    } else {
      details.push(
        ...result.error.issues.map((issue) => ({
          field: issue.path.join('.') || source,
          message: issue.message,
        })),
      );
    }
  }

  if (details.length) return next(new HttpError(400, 'Validation failed', details));
  next();
};
