function notFound(req, res, next) {
  res.status(404).json({ success: false, message: "Route haipo" });
}

function errorHandler(err, req, res, next) {
  console.error(err);
  const status = err.status || 500;
  res.status(status).json({
    success: false,
    message: err.message || "Hitilafu ya ndani ya server",
  });
}

module.exports = { notFound, errorHandler };
