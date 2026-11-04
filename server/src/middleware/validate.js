// Placeholder middleware for request validation (validation handled inline in routes via Zod)
export function validate(schema) {
  return (req, res, next) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: result.error.flatten()
      });
    }
    req.validatedBody = result.data;
    next();
  };
}

