/**
 * - Bir function'i parametre olarak alir
 * - function'i calistirit
 * - hata olusursa hata middelware'e yonlendirir
 * - butun async function'lari bu fonction ile sarmalayacagiz.
 */

module.exports = (fn) => {
  return (req, res, next) => {
    fn(req, res, next).catch(next);
  };
};
