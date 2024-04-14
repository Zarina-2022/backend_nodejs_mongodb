const express = require("express");
const tourModel = require("../models/tourModel");

exports.getAllTours = async (req, res) => {
  try {
    //   filtreleme 1 yontem
    // esettir operatoru ile filtreleme:
    //const allTours = await tourModel.find(req.query);

    /* buyuk veya kucuk operatorler ile filtreleme
    const allTours = await tourModel.find({
      price: { $lte: '300'},
      duration: { $gt: '12'}
      })
      */

    // yukaridaki manuel kodu dinamik koda cevirelim:

    //! 1 = > FILTRELEME
    // 1.1 once gelen query parametresinin kopyasini olusturup bir degiskene aktaralim.
    const queryObj = { ...req.query };
    console.log("before excludedField", queryObj);

    // 1.2 filtreleme disinda (sort,limit,sayfalama gibi) kullanacagimiz parametreleri queryObj'ten kaldir:
    const excludedFields = ["sort", "limit", "page", "fields"];
    excludedFields.forEach((item) => delete queryObj[item]);
    console.log("after excludedField", queryObj);

    // 1.3 replace kullanabilmemiz icin nesneyi stringe cevirecegiz:
    let queryString = JSON.stringify(queryObj);

    //  1.4 burdaki operatorleri git ara bul ve baslarina $ isareti koy:
    queryString = queryString.replace(
      /\b(gte|gt|lte|lt|ne)\b/g,
      (found) => `$${found}`
    );

    // 1.5 Tour verilerini filtrele:
    let query = tourModel.find(JSON.parse(queryString));

    //! 2 = > SIRALAMA (SORT)

    // 2.1 her zaman siralama yapmayacagiz, sadece asagidaki kosul gerceklesirse yapacagiz:
    if (req.query.sort) {
      // once birden fazla sort sarti olursa ona gore kod yazalim:
      // eger degerlerin value su ayni ise ikinci kosul verebiliriz.
      // ex. yasi 18 olan larin puana gore siralamak gibi
      // ex. urlde: -ratingsAverage,-ratingsQuantity
      // kodun calismasi icin virgulu kaldirmamiz lazim:
      const sortBy = req.query.sort.split(",").join(" ");
      query = query.sort(sortBy);
    } else {
      // eger sort yoksa olusturulma tarihine gore en bugunden eskiya gore siralar:
      query = query.sort("-createdAt");
    }

    //! 3 = > ALAN LIMITLEME (FIELDS)
    // 3.1 params.fields ile istenmeyen alanlari kaldir:
    if (req.query.fields) {
      const fields = req.query.fields.split(",").join(" ");
      query = query.select(fields);
    } else {
      // 3.2 fields gelmediyse __v degerini kaldir:
      query = query.select("-__v");
    }

    //! 4 = > ALAN LIMITLEME (FIELDS)
    // skip methodu = kac tane dokuman atlanacak
    // limit methodu = max kac dokuman alinacak (sayfa basina eleman sayisi)
   
      // aciklama: eger page degeri yoksa default olarag 1 olsun
      const page = Number(req.query.page) || 1;
      // aciklama: eger limit degeri yoksa default olarag sayfa basi 10 olsun
      const limit = Number(req.query.limit) || 10;
      // kactane eleman atlamasi gerekiyor siradaki sayfaya gecmek icin:
      const skip = (page - 1) * limit;
      query = query.skip(skip).limit(limit);


    //=====================================================================
    // SON: hazirladigimiz komutu calistir, verileri al
    const tours = await query;

    /* filtreleme 2.yontem
    const allTours = await tourModel
      .find()
      .where("difficulty")
      .equals("easy")
      .where("duration")
      .equals(5);
    */
    // ==============================================================
    res.status(200).json({
      message: "All data get successfully",
      result: tours.length,
      data: tours,
    });
  } catch (err) {
    res.status(400).json({
      message: "Data alirken hata olustu",
    });
  }
};

exports.createTour = async (req, res) => {
  // req.body'ye ulasmak icin index.js'te | app.use(express.json());| yazmamiz lazim (database ten gelen veriyi js.formatina cevirir.)
  console.log(req.body); // cikti: { name: 'Ornek', price: '600', isPremium: true }

  // database e yeni bir tour ekle. Iki yontem var.

  /* Birinci yontem spread operator use:
  const yeniTur = new tourModel({ ...req.body });
  yeniTur.save();
  */

  // Ikinci yontem create() use , daha iyi:
  try {
    const newTour = await tourModel.create(req.body);
    res.status(200).json({ message: "Post basarili", data: newTour });
  } catch (err) {
    res.status(400).json({
      message: "Post yaparken bir hata olustu",
    });
  }
};

exports.getTour = async (req, res) => {
  try {
    // 1st method (findOne())
    // const oneTour = await tourModel.findOne({ _id: req.params.id });

    // 2nd method (findById())
    const oneTour = await tourModel.findById(req.params.id);

    res.status(200).json({ message: "Data get successfully", data: oneTour });
  } catch (error) {
    res.status(400).json({
      message: "Data alirken hata olustu",
    });
  }
};

exports.updateTour = async (req, res) => {
  try {
    // findByIdAndUpdate teki ucuncu new:true parametresi guncellenmis veriyi getiriz bize.
    const updatedTour = await tourModel.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    res
      .status(200)
      .json({ message: "Tour is updated successfully", data: updatedTour });
  } catch (err) {
    res.status(400).json({ message: "It is not updated." });
  }
};

exports.deleteTour = async (req, res) => {
  try {
    const deletedTour = await tourModel.findByIdAndDelete(req.params.id);
    res.status(204).json({});
  } catch (err) {
    res.status(400).json({ message: "Tour is not deleted." });
  }
};
