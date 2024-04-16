//! Veri tabanina kaydedecegimiz verinin tablosunu, sablonunu, kalibini veya schema sini yolusturacagiz.

/**
 * Database e ekleyecegimiz document'in:
 *   - hangi degerlere ve hangi type verilere sahip olmasini belirledigimiz;
 *   - varsayilan degerinin benzersiz olma durumu;
 *   - verinin kaydedilmeden once degismesi gereken alanlari belirledigimiz yapidir.
 *
 */

/**
 * Kaydedilmeden once degismesi gereken alanlari derken:
 *    - verinin  database kaydedilmeden once gecmesi gereken islemleri burada yazabiliyoruz.
 *  Mesela: title kaydedilmeden once toLowerCase() yapilmasi gerekiyorsa bunu burada belirtebiliriz.
 */

/**
 * Schemayi kullanabilmemiz icin once onu mongoose den import etmemiz gerekiyor:
 */

const { Schema, model } = require("mongoose"); // mongoose un icinden Schema yi import et
const validator = require("validator"); // npm i validator (package)

/**
 * Bu typelarin limitlerini vermek zorundayiz:
 *      - unique: ayni name ile  baska veri kaydedemezsin sonra; veya ayni email ile bir siteye tekrar kaydolamaszin.
 *      - message: unique veya herhangi baska deger verirken eger hata olusursa system kendisi otomatik hata mesaji olusturup frontende donderir.
 *                 Fakat eger kendin message yazip gondermek istersen: unique: [true, 'Isim degeri benzersiz olmali']
 *      - default: required degilse, bos kaydedilmesin diye default degerini veririz.
 *
 * */

//! 1-step: create Schema :
const tourSchema = new Schema(
  {
    name: {
      // Validation
      type: String,
      unique: [true, "Isim degeri benzersiz olmali"],
      required: true,
      minLength: [10, "Tour name must be at least 10 characters."], // buil-in validators
      maxLength: [40, "Tour name must be les than 40 characters."], // buil-in validators
      validate: [
        validator.isAlpha, // sadece harf icermesi gerekiyor.        // validator package
        "A tour name must only contain characters between A-Z",
      ],
    },
    duration: {
      // Validation
      type: Number,
      required: true,
    },
    maxGroupSize: {
      // Validation
      type: Number,
      required: true,
    },
    difficulty: {
      // Validation
      type: String,
      required: true,
      // burada message eklemek icin su kalibi use {value:[],message:""} :
      enum: {
        values: ["easy", "medium", "difficult"],
        message: "difficulty level not valid",
      }, // sadece bu degerleri yazabilirsin yeni tour eklerken  // buil-in validators
    },
    ratingsAverage: {
      // Validation
      type: Number,
      default: 4.0,
    },
    ratingsQuantity: {
      // Validation
      type: Number,
      default: 0,
    },
    price: {
      // Validation
      type: Number,
      required: [true, "Fiyat yazmak zorunludur"],
    },
    priceDiscount: {
      // indirim degeri price tan dusuk ise gecerli degilse gecersiz.  // custom validator = kendimiz yazdik
      type: Number,
      validate: {
        validator: function (value) {
          return value < this.price;
        },
        message: "Discount Price cannot be greater than normal price.",
      },
    },
    summary: {
      type: String,
      trim: true, // kaydedilen verinin bas ve sonundaki bosluklari siler
      maxLength: [1000, "You can not more than 1000 characters here."], // veri tabaninin maaliyetini standartlastirmak icin use
      required: true,
    },
    description: {
      type: String,
      trim: true, // kaydedilen verinin bas ve sonundaki bosluklari siler
      maxLength: [2000, "You can not more than 1000 characters here."], // veri tabaninin maaliyetini standartlastirmak icin use
    },
    imageCover: {
      type: String,
      required: true,
    },
    images: [String],
    startDates: [Date],
    createdAt: {
      type: Date,
      default: Date.now(),
    },
    hour: Number, // asagida post yaparken ekledigimiz yeni deger icin
  },
  // virtual property icin schema ayarlari
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

//! 2-step: create Virtual Property:

// Database te tutmamiza degmeyecek (maaliyeti indirmek lazim) ama client tarafindan
// yapilan isteklerde gondermemiz gereken datalari databaste tutmayip client'a gonderirken hesaplama islemidir.

/* create structure:
    - schema + virtual (tourSchema.virtual)
    - eklemek istedigimiz bu sanal degerin ismini yaziyoruz ('slug'). 
        slug nedir? = url'e ekleyecek olacagimiz tour isminin url'i uyarlanmis olan versiyonudur.
        They usually contain lowercase letters, numbers, and hyphens, with spaces replaced by hyphens or underscores. 
    - ardindan bunu hesaplamam lazim function ile (.get(function(){}))
    - virtual propertide kullanmak istedigim dataya ulasmam lazim. Bunu 'this' ile yapariz:
      Burada kesinlikle error function kullanmiyoruz.
      Normal function kullaniriz cunku 'this' anahtar kelimesine erismemiz lazim.
      'this' araciligi ile tours degerlerine (value) erisebiliyoruz.
*/
tourSchema.virtual("slug").get(function () {
  /* 
    tour'un name'ine ulasiriz (this.name)
    name'i kucuk harfler ile yazilsin (.toLowerCase())
    aradaki bosluklarin yerine cizgi koysun (.replace(/ /g,'-'))
    normalde replace(' ','-') sadece buldugu ilk boslugu degistirir.
    ama / /g sekilde yazarsak global olarak bulgugu tum bosluklari degistirir.

  */
  return this.name.toLowerCase().replace(/ /g, "-");
});

//! 3-step: create Document Middelware pre:
// asagidaki middelware veriler alinmadan (get gerceklesmeden) once calisacaktir
/*
Middelware - bizim icin iki olay arasinda calisan yapidir.
ex. verinin alinip database kaydedilmesi sirasinda

pre(icine yazacagimiz islemden once function calissin.)
middelware oldugu icin next parametresini alir.

burdaki 'this' veriler cekilmeden once, cekilecek olan verileri listeler.
*/
/*
tourSchema.pre("find", function (next) {
  console.log('middelware pre calisti',this);
  // sonraki adima gecis izni:
  next()
});
*/
tourSchema.pre("save", function (next) {
  //console.log("middelware pre calisti", this);
  // database save olmadan once yeni deger ekledik:
  // birde schemaya gidip hour:Number diye eklememiz lazim:
  this.hour = this.duration * 24; // duration 4 gun = bunu saate cevirelim
  // sonraki adima gecis izni:
  next();
});

//! 4-step: create Document Middelware post:
// asagidaki middelware veriyi her kaydettigimizden(kaydetme gerceklestikten)sonra calisacaktir
/*
post(icine yazacagimiz islemden sonra function calissin.)
middelware oldugu icin next parametresini alir.

e.g = user yeni hesap olusturduktan hemen sonra, bu ay rapor sayisi +1 seklinde guncellensin.  
      user yeni rapor olusturduktan hemen sonra, bir email ona donderilsin.  
      user password update yaptiktan hemen sonra, bir email ona donderilsin.  

tourSchema.post("save", function (doc, next) {
  console.log("middelware post calisti", doc);
  // sonraki adima gecis izni:
  next();
});
*/

tourSchema.post("aggregate", function (doc, next) {
  console.log("middelware post calisti", doc);
  // sonraki adima gecis izni:
  next();
});

//! 5-step: create Query (Sorgu, Zapros) Middelware:
// post ve pre kullanilir.
// raporlama, filtreleme etc yaparken dahil olmasini istemedigimiz veriler icin yazilir.
// regex (/^find/) kullanarak tum find metodlarinda asagidaki function gecerli olacak.
tourSchema.pre(/^find/, async function (next) {
  // ozel olanlari listeden cikart. 'this' refer to schema:
  // find isteklerinde secret:true olanlar haric diger verileri al.
  this.find({ secret: { $ne: true } });
  next();
});

//hicbir rapora gizli olanlari dahil etme
tourSchema.pre("aggregate", async function (next) {
  // raporin ilk adimini belirle
  // raporlama adimlari(pipeline)'ndan once calismasi lazim bu function:
  // pipeline'nin en basina yeni bir eleman ekleyecegim
  // bu bir dizi oldugu icin unchift() use. Cunku arrayin[] basina item eklemek icin kullanilir unchift()
  this.pipeline().unshift({ $match: { secret: { $ne: true } } });
  next();
});

//! 6-step: create Model: once mongoose ten model import et :
/**
 * Kollection'a ulasmamiz icin schema tek basina yeterli degil.
 * Model schema daki kisitlamalara gore collection'a yeni bir data add, delete or get
 * gibi islemleri yapmamiza olanak saglar.
 */

// model olustururken birinci parametrede modele isim veriyoruz (Tour),
// ikinci parametre yukarida olusturdugumuz schema ismi:
const tourModel = model("Tour", tourSchema);

/**
 * 
 
  duration: Number,
  maxGroupSize: Number,
  difficulty: String,
  ratingsQuantity: Number,
  summary: String,
  description: String,
  summary:'',
  description'',
  imageCover:'',
  images:[],
  startDates:[],
});
 */

// tourModel'ini farkli dosyalarda kullanabilmek icin export ediyoruz.
module.exports = tourModel;
