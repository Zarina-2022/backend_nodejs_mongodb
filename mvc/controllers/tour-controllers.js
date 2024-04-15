const express = require("express");
const tourModel = require("../models/tourModel");
const APIFeatures = require("../../utils/apiFeatures");
const AppError = require("../../utils/appError");
const catchAsync = require("../../utils/catchAsync");

// ALIAS ROUTE
// middelware gibi davranacak:
// getAllTours'un en iyi 5 tanesini vermesi icin gerekli parametreleri ekledik:
exports.aliasBestPrices = (req, res, next) => {
  req.query.sort = "-ratingsAverage,price";
  req.query.fields = "name,price,ratingsAverage,summary,difficulty";
  req.query.limit = "5";

  next();
};

// Istatistiklei hesaplayan route
exports.getTourStats = async (req, res, next) => {
  try {
    // raporlama adimlari olusturalim (aggregation pipelines)
    const stats = await tourModel.aggregate([
      // 1 step (filtreleme) = ratingi 4 ve ustu olanlari  al.
      {
        $match: { ratingsAverage: { $gte: 4.0 } },
      },
      // 2 step (gruplama) = zorliuklara gore gruplandir ve ortalama degerlerini, ortalama fiyatlarini hesapla.
      {
        $group: {
          _id: "$difficulty",
          tourQuantity: { $sum: 1 }, // dokuman sayisi kadar ekleme yapar
          avgRating: { $avg: "$ratingsAverage" }, // e.g. medium: iki eleman var (4.5 ve 3.9). Bu iki reytingin ortalamasini bulalim.
          avgPrice: { $avg: "$price" }, //  e.g. medium: iki eleman var ( $50 ve $70). Bu iki fiyatin ortalamasini bulalim.
          minPrice: { $min: "$price" }, // bu elemanlarin en dusuk fiyatini almak istiyorsam
          maxPrice: { $max: "$price" }, // bu elemanlarin en yuksek fiyatini almak istiyorsam
        },
      },

      // 3 step (siralama) = gruplanan veriyi fiyatlara gore artan sirala
      {
        $sort: { avgPrice: 1 }, // (1) - artan fiyata gore sirala. (-1) azalan fiyata gore sirala
      },

      // 4 step = fiyati 400 den kucuk olanlari kaldir.
      {
        $match: { minPrice: { $gte: 400 } },
      },
    ]);

    res.status(200).json({
      message: "Aggregation is created successfully.",
      results: stats.length,
      data: stats,
    });
  } catch (err) {
    return next(new AppError("Aggregation is not created.", 400));
  }
};

exports.getMonthlyPlan = catchAsync(async (req, res, next) => {
    // To access the year parameter:
    const year = Number(req.params.year);

    //raporlama adimlari:
    const plan = await tourModel.aggregate([
      // 1-step:  1den fazla baslangic tarihi olan turlari baslangiz tarihine gore parcala:
      { $unwind: "$startDates" },

      // 2-step:  belirli bir yildan sonra baslayanlari al:
      {
        $match: {
          startDates: {
            $gte: new Date(`${year}-01-01`),
            $lte: new Date(`${year}-12-31`),
          },
        },
      },

      // 3-step: aldigin tourlari simdi aylara gore grouplandir:
      {
        $group: {
          _id: { $month: "$startDates" }, // turlarin bulundugu aylari bul
          numTourStarts: { $sum: 1 }, // bu bulunan her ayin icinde toplam tour sayisini bul
          tours: { $push: "$name" }, // bulunan turlarin isimlerini bul ve tours[] aktar. Document'in herhangi bir degerinden bit dizi olusturmak istiyorsak use push().
        },
      },

      // 4-step:  Rapordaki nesnelere '_id' yerine 'ay' ekleyelim:
      { $addFields: { month: "$_id" } }, //Bir nesneye (object) yeni bir deger (value) eklemek icin kullaniriz

      //  5-step: rapordaki nesnelerden eleman (value) cikarma
      {
        $project: { _id: 0 }, // silmek istediginiz elemana '0' vermeniz yeterli.
      },

      //  6-step: Aylara (artan) gore siralama.
      {
        $sort: { month: 1 },
      },
    ]);

    res.status(200).json({
      message: "Monthly plan is created successfully.",
      results: plan.length,
      data: plan,
    });
});

exports.getAllTours = catchAsync(async (req, res, next) => {
    // apiFeatures classindan bir ornek olusturduk ve icerisindeki istedigimiz api ozellilerini cagirdik:
    const features = new APIFeatures(tourModel.find(), req.query)
      .filter()
      .sort()
      .limit()
      .paginate();
    // SON: hazirladigimiz komutu calistir, verileri al
    const tours = await features.query;

    res.status(200).json({
      message: "All data get successfully",
      result: tours.length,
      data: tours,
    });
});

exports.createTour = catchAsync(async (req, res, next) => {
  // req.body'ye ulasmak icin index.js'te | app.use(express.json());| yazmamiz lazim (database ten gelen veriyi js.formatina cevirir.)

  // database e yeni bir tour ekle. Iki yontem var.

  /* Birinci yontem spread operator use:
  const yeniTur = new tourModel({ ...req.body });
  yeniTur.save();
  */

  // Ikinci yontem create() use , daha iyi:
    const newTour = await tourModel.create(req.body);
    res.status(200).json({ message: "Post basarili", data: newTour });
});

exports.getTour = catchAsync(async (req, res, next) => {
    // 1st method (findOne())
    // const oneTour = await tourModel.findOne({ _id: req.params.id });

    // 2nd method (findById())
    const oneTour = await tourModel.findById(req.params.id);

    res.status(200).json({ message: "Data get successfully", data: oneTour });
});

exports.updateTour = catchAsync(async (req, res, next) => {
    // findByIdAndUpdate teki ucuncu new:true parametresi guncellenmis veriyi getiriz bize.
    const updatedTour = await tourModel.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    res
      .status(200)
      .json({ message: "Tour is updated successfully", data: updatedTour });
});

exports.deleteTour = catchAsync(async (req, res, next) => {

    const deletedTour = await tourModel.findByIdAndDelete(req.params.id);
    res.status(204).json({});
});
