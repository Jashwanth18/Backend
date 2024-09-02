const asyncHandler = (handlerFunc) => (req, res, next) => {
  Promise.resolve(handlerFunc(req, res, next)).catch((error) => {
    next(error);
  });
};

export { asyncHandler };
