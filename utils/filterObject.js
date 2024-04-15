// filtrelenecek nesneyi gonderiyoruz
// nesnede izin verdigimiz alanlari yeni olusturdugumuz nesnede gonderiyoruz.

const filterObj = (obj, ...allowedFields) => {
  // object'i array'e cevirmek istiyorsak "object.case" kullanacagiz.:
  const newObj = {};
  Object.keys(obj).forEach((item) => {
    if (allowedFields.includes(item)) {
      newObj[item] = obj[item];
    }
  });
  console.log("eski object ==>>", obj);
  console.log("yeni object ==>>", newObj);

  return newObj;
};

module.exports = filterObj;
