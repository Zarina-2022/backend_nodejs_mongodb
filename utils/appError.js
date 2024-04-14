// Burada js'teki yerlesik hata modulunu gelistirip extra ozellikler ekledigimiz bir yapiya sahip olacak.
// JS'teki yerlesik hata class'inin butun ozelliklerinin disarisinda extra ozelliklere ve parametrelere sahip olan gelismis versiyonu olusturalim.

// extra ozelliler ekleyecegimiz yeni class'imizin ismi: AppError. Ve bu yeni class index.js'teki Error class'ini genisletecek.
class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    // durum koduna gore status degerini belirle: 4xx ise fail, 5xx ise error olmali:
    // startWith sadece metinler ile calistigi icin statusCode Stringe cevirmemiz lazim:
    this.status = String(this.statusCode).startsWith("4") ? "Fail" : "Error";

    // hatanin detaylari ve hata olusana kadar calisan dosyalarin bilgisini al:
    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = AppError;
