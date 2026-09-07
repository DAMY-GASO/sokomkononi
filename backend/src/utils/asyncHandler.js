// Kwa sababu tunatumia express-async-errors, hii ni wrapper ya ziada tu
// kwa controllers zinazotaka usomaji rahisi zaidi.
module.exports = (fn) => (req, res, next) => fn(req, res, next).catch(next);
