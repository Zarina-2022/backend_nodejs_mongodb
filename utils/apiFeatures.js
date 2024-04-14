// burada filtreleme, pagination gibi functionlar dinamik sekilde yazilacak.
// Kalip seklinde hazirlayacagiz.
// Bunu da JS teki class yapisinin bazi ozellikleri sayesinde yapabilecegiz.

class APIFeatures {
  // query=yapacagimiz istek, queryParams=frontend'ten gelen arama parametreleri
  constructor(query, queryParams) {
    // classin icerisine bu iki degeri degisken seklinde tanimlamis oluyorum.
    this.query = query;
    this.queryParams = queryParams;
  }

      //! 1 = > FILTRELEME
  // butun filtreleme ozellilerini bunu icerisinde yazacagim:
  filter() {
    // 1.1 once gelen query parametresinin kopyasini olusturup bir degiskene aktaralim.
    const queryObj = { ...this.queryParams };

    // 1.2 filtreleme disinda (sort,limit,sayfalama gibi) kullanacagimiz parametreleri queryObj'ten kaldir:
    const excludedFields = ["sort", "limit", "page", "fields"];
    excludedFields.forEach((item) => delete queryObj[item]);

    // 1.3 replace kullanabilmemiz icin nesneyi stringe cevirecegiz:
    let queryString = JSON.stringify(queryObj);

    //  1.4 burdaki operatorleri git ara bul ve baslarina $ isareti koy:
    queryString = queryString.replace(
      /\b(gte|gt|lte|lt|ne)\b/g,
      (found) => `$${found}`
    );

    // 1.5 Tour verilerini filtrele:
    this.query = this.query.find(JSON.parse(queryString));



    // return this yaparsak fonksiyonlari birbiri ardina siralayabiliyoruz:
    // yani => api.paginate().sort().limit()
    // return this olmazsa her birini ayri cagirmak zorunda kaliriz =>
    // api.sort , api.limit , api.paginate gibi:
    return this;
  }

  //! 2 = > SIRALAMA (SORT)
  sort() {
    // 2.1 her zaman siralama yapmayacagiz, sadece asagidaki kosul gerceklesirse yapacagiz:
    if (this.queryParams.sort) {
      // once birden fazla sort sarti olursa ona gore kod yazalim:
      // eger degerlerin value su ayni ise ikinci kosul verebiliriz.
      // ex. yasi 18 olan larin puana gore siralamak gibi
      // ex. urlde: -ratingsAverage,-ratingsQuantity
      // kodun calismasi icin virgulu kaldirmamiz lazim:
      const sortBy = this.queryParams.sort.split(",").join(" ");
      this.query =  this.query.sort(sortBy);
    } else {
      // eger sort yoksa olusturulma tarihine gore en bugunden eskiya gore siralar:
      this.query =  this.query.sort("-createdAt");
    }

    return this;
  }

   //! 3 = > ALAN LIMITLEME (FIELDS)
  limit() {

    // 3.1 params.fields ile istenmeyen alanlari kaldir:
    if (this.queryParams.fields) {
        const fields = this.queryParams.fields.split(",").join(" ");
        this.query = this.query.select(fields);
      } else {
        // 3.2 fields gelmediyse __v degerini kaldir:
        this.query = this.query.select("-__v");
      }
    return this;
  }

   //! 4 = > ALAN LIMITLEME (FIELDS)
  paginate() {
    // skip methodu = kac tane dokuman atlanacak
    // limit methodu = max kac dokuman alinacak (sayfa basina eleman sayisi)
   
      // aciklama: eger page degeri yoksa default olarag 1 olsun
      const page = Number(this.queryParams.page) || 1;
      // aciklama: eger limit degeri yoksa default olarag sayfa basi 10 olsun
      const limit = Number(this.queryParams.limit) || 10;
      // kactane eleman atlamasi gerekiyor siradaki sayfaya gecmek icin:
      const skip = (page - 1) * limit;
      this.query = this.query.skip(skip).limit(limit);

    return this;
  }
}

module.exports = APIFeatures